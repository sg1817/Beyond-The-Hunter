const $ = id => document.getElementById(id);
const p = carregar();
const NIVEIS = ["Inexperiente","Despertado","Aprendiz","Experiente","Especialista","Mestre"];
const DOMINIOS = ["Não aprendido","Básico","Treinado","Especialista"];
const TECNICAS = [
  { nome:"Ten", min:1, custo:1, nota:"+1 sucesso na defesa compatível. Manutenção: 1 PA a cada 3 rodadas." },
  { nome:"Zetsu", min:1, custo:0, nota:"+2 dados em furtividade contra aura. Sem Hatsu, Ten ou Ren." },
  { nome:"Ren", min:1, custo:2, nota:"+2 dados em pressão de aura. Custa 2 PA por rodada." },
  { nome:"Hatsu", min:2, custo:0, nota:"Cada habilidade define seu próprio custo." },
  { nome:"Gyo", min:2, custo:1, nota:"Percebe aura oculta. Teste: Percepção + Controle." },
  { nome:"In", min:2, custo:1, nota:"Oculta manifestações de aura. 1 PA por rodada." },
  { nome:"Shu", min:2, custo:2, nota:"Reveste objeto: +1 dano. Manutenção: 1 PA por rodada." },
  { nome:"En", min:3, custo:3, nota:"Percepção em área (5 m). Manutenção: 2 PA por rodada." },
  { nome:"Ko", min:3, custo:4, nota:"+3 dados em um ataque; o resto do corpo fica sem proteção." },
  { nome:"Ken", min:3, custo:3, nota:"+2 sucessos contra ataques de aura. Manutenção: 2 PA por rodada." },
  { nome:"Ryu", min:4, custo:1, nota:"Redistribui a aura pelo corpo. 1 PA por rodada." }
];
const max = paMax(p);
if (p.nen.paAtual === null || p.nen.paAtual > max) p.nen.paAtual = max;

// Estado de sobrecarga pela porcentagem de PA que sobrou
function estado() {
  const pct = p.nen.paAtual / max;
  if (p.nen.paAtual === 0) return "Esgotado";
  if (pct <= 0.25) return "Exausto";
  if (pct <= 0.5) return "Cansado";
  return "Estável";
}

function usar(t) {
  // TAREFA: aplicar aqui a redução de custo pelo Controle de Nen (tabela de eficiência)
  const custo = t.custo;
  if (custo > p.nen.paAtual) { $("msg").textContent = `PA insuficiente para ${t.nome}.`; return; }
  p.nen.paAtual -= custo;
  $("msg").textContent = `${t.nome} usado (-${custo} PA).`;
  salvar(p); desenhar();
}

function desenhar() {
  $("pa").textContent = `${p.nen.paAtual} / ${max}`;
  $("estado").textContent = estado();
  $("controle").value = p.nen.controle;
  $("tecnicas").innerHTML = "";
  TECNICAS.forEach(t => {
    const dom = p.nen.tecnicas[t.nome] || DOMINIOS[0];
    const liberada = p.nen.controle >= t.min;
    const linha = document.createElement("div");
    linha.className = "linha";
    linha.innerHTML = `<strong>${t.nome}</strong> <span class="suave">controle ${t.min}+ · custo ${t.custo} PA</span><p class="suave">${t.nota}</p>`;
    const sel = document.createElement("select");
    DOMINIOS.forEach(d => sel.add(new Option(d, d)));
    sel.value = dom; sel.disabled = !liberada;
    sel.addEventListener("change", () => { p.nen.tecnicas[t.nome] = sel.value; salvar(p); desenhar(); });
    linha.appendChild(sel);
    if (t.custo > 0) {
      const bt = document.createElement("button");
      bt.textContent = `Usar ${t.nome}`;
      bt.disabled = !liberada || dom === DOMINIOS[0];
      bt.addEventListener("click", () => usar(t));
      linha.appendChild(bt);
    }
    $("tecnicas").appendChild(linha);
  });
}

NIVEIS.forEach((n, i) => $("controle").add(new Option(`${i} - ${n}`, i)));
$("controle").addEventListener("change", () => {
  p.nen.controle = Number($("controle").value); salvar(p); desenhar();
});
$("descansar").addEventListener("click", () => {
  p.nen.paAtual = max; $("msg").textContent = "PA restaurado."; salvar(p); desenhar();
});
desenhar();