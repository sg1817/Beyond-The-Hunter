const $ = id => document.getElementById(id);
const p = carregar();
const TIPOS_DANO = ["Corte","Perfurante","Contundente","Nen"];
const ALCANCES = ["Corpo a corpo","Médio","Longo"];
const CAMPOS = ["nome","dano","tipoDano","alcance","pericia","atributo","extra","notas"];

TIPOS_DANO.forEach(t => $("tipoDano").add(new Option(t, t)));
ALCANCES.forEach(a => $("alcance").add(new Option(a, a)));
PERICIAS.forEach(s => $("pericia").add(new Option(s, s)));
ATRIBUTOS.forEach(a => $("atributo").add(new Option(a, a)));
$("arma").add(new Option("Personalizada", ""));
ARMAS.forEach(a => $("arma").add(new Option(a.nome, a.nome)));

// Escolher uma arma do catálogo preenche os campos (depois dá para ajustar)
$("arma").addEventListener("change", () => {
  const a = ARMAS.find(x => x.nome === $("arma").value);
  if (!a) return;
  $("nome").value = a.nome; $("dano").value = a.dano; $("alcance").value = a.alcance;
  $("tipoDano").value = a.tipo; $("pericia").value = a.pericia; $("atributo").value = a.atributo;
});

// Dano extra só existe com Shu aprendido (+1 de dano)
const limiteExtra = () => (p.nen.tecnicas["Shu"] || "Não aprendido") !== "Não aprendido" ? 1 : 0;
const dadosAtaque = a => p.atributos[a.atributo] + nivelPericia(p, a.pericia);

// Regras: o ataque rola Atributo + Perícia (D6; 5 e 6 = sucesso) e só mostra os sucessos.
// O dano é uma rolagem à parte, SEM regra de sucessos: rola os dados de dano do ataque
// e soma os valores sorteados (mais o dano extra do Shu).
const MAX_DADOS_DANO = 10;
let rolando = false;

function rolarAtaque(a) {
  if (rolando) return;
  rolando = true;
  const total = Math.max(0, dadosAtaque(a) + ajusteVantagem($("vant").checked, $("desv").checked));
  const r = rolarDados(total);
  const info = el("p", `${a.nome}: rolando ataque (${total}D6)...`), caixa = el("div");
  $("resAtaque").replaceChildren(el("h3", "Ataque"), info, caixa);
  animarDados(caixa, r).then(() => {
    rolando = false;
    info.textContent = `${a.nome}: ${total}D6, ${r.sucessos} sucesso(s)`;
  });
}

function rolarDano(a) {
  if (rolando) return;
  rolando = true;
  const r = rolarDados(a.dano);
  const info = el("p", `${a.nome}: rolando dano (${a.dano}D6)...`), caixa = el("div");
  $("resDano").replaceChildren(el("h3", "Dano"), info, caixa);
  animarDados(caixa, r, false).then(() => { // false = não destaca 5 e 6
    rolando = false;
    const soma = r.dados.reduce((total, d) => total + d, 0);
    info.textContent = `${a.nome}: ${a.dano}D6 de dano`;
    $("resDano").append(
      el("p", `Dano total: ${soma + a.extra}`, "num"),
      el("p", `${r.dados.join(" + ")} = ${soma}${a.extra ? ` + ${a.extra} de dano extra` : ""}`, "suave"));
  });
}

// ---------- Vida (PV) ----------
const pvTotal = pvMax(p);
if (p.pvAtual === null || p.pvAtual > pvTotal) p.pvAtual = pvTotal;
let pvMostrado = p.pvAtual;
function desenharPV() {
  contar($("pvTxt"), pvMostrado, p.pvAtual, v => `${v} / ${pvTotal}`);
  pvMostrado = p.pvAtual;
  atualizarBarra($("barraPV"), p.pvAtual, pvTotal, estadoPorcentagem(p.pvAtual, pvTotal));
  $("pvAviso").textContent = p.pvAtual === 0 ? "Personagem caído." : "";
}
function mudarPV(sinal) {
  const v = Math.max(0, Math.floor(Number($("pvValor").value)) || 0);
  p.pvAtual = Math.min(pvTotal, Math.max(0, p.pvAtual + sinal * v));
  salvar(p); desenharPV();
}
$("pvDano").addEventListener("click", () => mudarPV(-1));
$("pvCura").addEventListener("click", () => mudarPV(1));
desenharPV();

iniciarLista(p, "ataques", {
  vazio: () => ({ nome:"", dano:1, tipoDano:TIPOS_DANO[0], alcance:ALCANCES[0], pericia:"Luta", atributo:"Força", extra:0, notas:"" }),
  preencher(a) { $("extra").max = limiteExtra(); $("arma").value = ""; CAMPOS.forEach(c => $(c).value = a[c]); },
  ler() {
    const a = {};
    CAMPOS.forEach(c => a[c] = $(c).value);
    a.dano = Number(a.dano); a.extra = Number(a.extra);
    return a;
  },
  validar(a) {
    if (!a.nome.trim()) return "Dê um nome ao ataque.";
    if (!(a.dano >= 1 && a.dano <= MAX_DADOS_DANO)) return `Os dados de dano vão de 1 a ${MAX_DADOS_DANO}.`;
    if (!(a.extra >= 0 && a.extra <= limiteExtra())) return `Dano extra só vem do Shu (máximo ${limiteExtra()}).`;
    return "";
  },
  card(a, card, acoes) {
    card.append(el("strong", a.nome),
      el("p", `Dano ${a.dano}D6${a.extra ? " +" + a.extra : ""} · ${a.tipoDano} · ${a.alcance}`, "suave"),
      el("p", `Ataque: ${a.atributo} + ${a.pericia} = ${dadosAtaque(a)}D6`, "suave"));
    if (a.notas) card.append(el("p", a.notas, "suave"));
    acoes.append(botao("Rolar ataque", () => rolarAtaque(a)), botao("Rolar dano", () => rolarDano(a)));
  }
});

// ---------- Rodadas e aura ----------
const paTotal = paMax(p);
if (p.nen.paAtual === null || p.nen.paAtual > paTotal) p.nen.paAtual = paTotal;
criarChama($("chama"));
const mostrarPA = () => {
  $("paTxt").textContent = `Aura ${p.nen.paAtual} / ${paTotal}`;
  atualizarChama($("chama"), p.nen.paAtual, paTotal, Object.keys(p.nen.ativas).length > 0);
};
mostrarPA();
iniciarRodadas(p, mostrarPA);