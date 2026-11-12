const $ = id => document.getElementById(id);
const p = carregar();
const CUSTO_PE = { atributos: 5, pericias: 2 }; // tabela de evolução do sistema
const soma = obj => Object.values(obj).reduce((a, b) => a + b, 0);
const nivel = (grupo, nome) => grupo === "atributos" ? p.atributos[nome] : nivelPericia(p, nome);

// ---------- Campos de texto livres ----------
["nome","idade","ocupacao","tipoNen","historia"].forEach(c => {
  $(c).value = p[c];
  $(c).addEventListener("input", () => { p[c] = $(c).value; salvar(p); });
});

// ---------- Regras de pontos ----------
// Criação: 12 pontos de atributo no total e 10 de perícia, máximo 3 em cada.
// Depois de criado: evolui gastando PE, máximo 5.
function podeAumentar(grupo, nome) {
  if (nivel(grupo, nome) >= (p.criado ? 5 : 3)) return false;
  if (p.criado) return p.pe >= CUSTO_PE[grupo];
  return (grupo === "atributos" ? 12 - soma(p.atributos) : 10 - soma(p.pericias)) > 0;
}
function podeDiminuir(grupo, nome) {
  if (p.criado) return false; // depois de criado só evolui
  return grupo === "atributos" ? p.atributos[nome] > 1 : p.pericias[nome] > 0;
}
function mudar(grupo, nome, delta) {
  if (delta > 0) {
    if (!podeAumentar(grupo, nome)) return;
    if (p.criado) p.pe -= CUSTO_PE[grupo];
  } else if (!podeDiminuir(grupo, nome)) return;
  p[grupo][nome] += delta;
  salvar(p); atualizar();
}

// ---------- Origem ----------
// Se a origem trocar, a perícia da nova origem pode estourar o limite 3: devolve o ponto
function respeitarLimite() {
  if (p.criado) return;
  PERICIAS.forEach(s => { while (nivelPericia(p, s) > 3 && p.pericias[s] > 0) p.pericias[s]--; });
}
function preencherPericiasOrigem() {
  const lista = (ORIGENS[p.origem] || { pericias: [] }).pericias;
  $("periciaOrigem").innerHTML = "";
  lista.forEach(s => $("periciaOrigem").add(new Option(s, s)));
  p.periciaOrigem = lista.includes(p.periciaOrigem) ? p.periciaOrigem : (lista[0] || "");
  $("periciaOrigem").value = p.periciaOrigem;
}
if (!ORIGENS[p.origem]) p.origem = "";
Object.keys(ORIGENS).forEach(n => $("origem").add(new Option(n, n)));
$("origem").value = p.origem;
$("origem").addEventListener("change", () => {
  p.origem = $("origem").value; preencherPericiasOrigem(); respeitarLimite(); salvar(p); atualizar();
});
$("periciaOrigem").addEventListener("change", () => {
  p.periciaOrigem = $("periciaOrigem").value; respeitarLimite(); salvar(p); atualizar();
});

// ---------- Linhas com botões - e + ----------
const linhas = [];
function criarLinha(idCaixa, nome, grupo) {
  const caixa = document.createElement("div");
  caixa.className = "ctrl";
  const rot = document.createElement("label");
  rot.textContent = nome;
  const menos = document.createElement("button");
  menos.textContent = "-"; menos.setAttribute("aria-label", "Diminuir " + nome);
  const valor = document.createElement("span");
  const mais = document.createElement("button");
  mais.textContent = "+"; mais.setAttribute("aria-label", "Aumentar " + nome);
  menos.addEventListener("click", () => mudar(grupo, nome, -1));
  mais.addEventListener("click", () => mudar(grupo, nome, 1));
  caixa.append(rot, menos, valor, mais);
  $(idCaixa).appendChild(caixa);
  linhas.push({ grupo, nome, valor, menos, mais });
}
ATRIBUTOS.forEach(n => criarLinha("atributos", n, "atributos"));
PERICIAS.forEach(n => criarLinha("pericias", n, "pericias"));

// ---------- Atualiza a tela inteira a partir dos dados ----------
function atualizar() {
  const atrRest = 12 - soma(p.atributos), perRest = 10 - soma(p.pericias);
  $("pv").textContent = pvMax(p);
  $("pa").textContent = paMax(p);
  $("defesa").textContent = p.atributos["Vigor"] + p.atributos["Agilidade"];
  linhas.forEach(l => {
    l.valor.textContent = nivel(l.grupo, l.nome);
    l.menos.disabled = !podeDiminuir(l.grupo, l.nome);
    l.mais.disabled = !podeAumentar(l.grupo, l.nome);
  });

  const o = ORIGENS[p.origem];
  $("origemInfo").textContent = o ? `Benefício: ${o.beneficio} Complicação: ${o.complicacao}` : "Escolha uma origem para ver o benefício.";
  $("origem").disabled = $("periciaOrigem").disabled = p.criado;

  if (p.criado) {
    $("modo").textContent = "Personagem criado. Para evoluir, gaste Pontos de Evolução (PE).";
    $("ptsAtr").textContent = "Evolução: +1 em atributo custa 5 PE (máximo 5).";
    $("ptsPer").textContent = "Evolução: +1 em perícia custa 2 PE (máximo 5).";
  } else {
    $("modo").textContent = "Criação: distribua seus pontos. Depois de finalizar, só é possível evoluir com PE.";
    $("ptsAtr").textContent = `${atrRest} pontos de atributo restantes (todos começam em 1, máximo 3).`;
    $("ptsPer").textContent = `${perRest} pontos de perícia restantes (máximo 3 por perícia).`;
  }

  $("blocoPe").hidden = !p.criado;
  if (document.activeElement !== $("pe")) $("pe").value = p.pe;
  $("blocoFinal").hidden = p.criado;
  const faltas = [];
  if (!p.origem) faltas.push("escolher a origem");
  if (atrRest > 0) faltas.push(`${atrRest} ponto(s) de atributo`);
  if (perRest > 0) faltas.push(`${perRest} ponto(s) de perícia`);
  $("faltam").textContent = faltas.length ? "Falta: " + faltas.join(", ") + "." : "Tudo pronto para finalizar.";
  $("finalizar").disabled = faltas.length > 0;
}

$("pe").addEventListener("input", () => { p.pe = Math.max(0, Number($("pe").value) || 0); salvar(p); atualizar(); });
$("finalizar").addEventListener("click", () => {
  if (confirm("Finalizar a criação? Depois disso só é possível evoluir com PE.")) { p.criado = true; salvar(p); atualizar(); }
});

preencherPericiasOrigem();
respeitarLimite();
salvar(p);
atualizar();

// ---------- Backup: baixar e carregar o personagem em arquivo ----------
$("exportar").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }));
  a.download = (p.nome || "personagem") + ".json";
  a.click();
});
$("importar").addEventListener("change", e => {
  const arq = e.target.files[0];
  if (!arq) return;
  arq.text().then(t => {
    try { salvar(Object.assign(novoPersonagem(), JSON.parse(t))); location.reload(); }
    catch { alert("Arquivo inválido."); }
  });
});