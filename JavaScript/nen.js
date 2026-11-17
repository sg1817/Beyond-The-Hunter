const $ = id => document.getElementById(id);
const p = carregar();
const NIVEIS = ["Inexperiente","Despertado","Aprendiz","Experiente","Especialista","Mestre"];
const DOMINIOS = ["Não aprendido","Básico","Treinado","Especialista"];
const CUSTO_CONTROLE = [0, 0, 4, 6, 8, 12]; // PE para chegar a cada nível
const CUSTO_DOMINIO = [3, 2, 4];            // PE para sair de cada domínio
const TECNICAS = [
  { nome:"Ten", dura:true, min:1, custo:1, nota:"+1 sucesso na defesa compatível. Manutenção: 1 PA a cada 3 rodadas." },
  { nome:"Zetsu", min:1, custo:0, nota:"+2 dados em furtividade contra aura. Sem Hatsu, Ten ou Ren." },
  { nome:"Ren", dura:true, min:1, custo:2, nota:"+2 dados em pressão de aura. Custa 2 PA por rodada." },
  { nome:"Hatsu", min:2, custo:0, nota:"Cada habilidade define seu próprio custo." },
  { nome:"Gyo", min:2, custo:1, nota:"Percebe aura oculta. Teste: Percepção + Controle." },
  { nome:"In", dura:true, min:2, custo:1, nota:"Oculta manifestações de aura. 1 PA por rodada." },
  { nome:"Shu", dura:true, min:2, custo:2, nota:"Reveste objeto: +1 dano. Manutenção: 1 PA por rodada." },
  { nome:"En", dura:true, min:3, custo:3, nota:"Percepção em área (5 m). Manutenção: 2 PA por rodada." },
  { nome:"Ko", min:3, custo:4, nota:"+3 dados em um ataque; o resto do corpo fica sem proteção." },
  { nome:"Ken", dura:true, min:3, custo:3, nota:"+2 sucessos contra ataques de aura. Manutenção: 2 PA por rodada." },
  { nome:"Ryu", dura:true, min:4, custo:1, nota:"Redistribui a aura pelo corpo. 1 PA por rodada." }
];
const max = paMax(p);
if (p.nen.paAtual === null || p.nen.paAtual > max) p.nen.paAtual = max;
let paMostrado = p.nen.paAtual;

// Ten, Zetsu e Ren (controle 1) já começam em Básico
const dominio = t => p.nen.tecnicas[t.nome] || (t.min <= 1 ? DOMINIOS[1] : DOMINIOS[0]);

const estado = () => estadoPorcentagem(p.nen.paAtual, max);
function gastar(custo, texto) {
  if (custo > p.pe) { $("msg").textContent = `PE insuficiente: custa ${custo} e você tem ${p.pe}.`; return false; }
  p.pe -= custo; $("msg").textContent = texto;
  return true;
}
function evoluirControle() {
  if (gastar(CUSTO_CONTROLE[p.nen.controle + 1], "Controle de Nen evoluiu.")) { p.nen.controle++; salvar(p); desenhar(); }
}
function evoluir(t, idx) {
  if (gastar(CUSTO_DOMINIO[idx], `${t.nome}: domínio ${DOMINIOS[idx + 1]}.`)) { p.nen.tecnicas[t.nome] = DOMINIOS[idx + 1]; salvar(p); desenhar(); }
}
function usar(t) {
  // TAREFA: aplicar aqui a redução de custo pelo Controle de Nen (tabela de eficiência)
  const custo = t.custo;
  if (custo > p.nen.paAtual) { $("msg").textContent = `PA insuficiente para ${t.nome}.`; return; }
  p.nen.paAtual -= custo;
  if (t.dura) p.nen.ativas[t.nome] = p.rodada; // fica ativa até encerrar
  $("msg").textContent = `${t.nome} usado (-${custo} PA).`;
  salvar(p); desenhar();
}

function encerrar(t) {
  delete p.nen.ativas[t.nome];
  $("msg").textContent = `${t.nome} encerrado.`;
  salvar(p); desenhar();
}

function desenhar() {
  contar($("pa"), paMostrado, p.nen.paAtual, v => `${v} / ${max}`);
  paMostrado = p.nen.paAtual;
  atualizarBarra($("barraPA"), p.nen.paAtual, max, estado());
  atualizarChama($("chama"), p.nen.paAtual, max, Object.keys(p.nen.ativas).length > 0);
  $("painel").classList.toggle("aura-ativa", Object.keys(p.nen.ativas).length > 0);
  $("estado").textContent = estado();
  $("pe").textContent = p.pe;
  $("controleTxt").textContent = `${p.nen.controle} - ${NIVEIS[p.nen.controle]}`;
  $("evoluirControle").hidden = p.nen.controle >= 5;
  if (p.nen.controle < 5) $("evoluirControle").textContent = `Evoluir Controle (${CUSTO_CONTROLE[p.nen.controle + 1]} PE)`;
  $("tecnicas").innerHTML = "";
  TECNICAS.forEach(t => {
    const dom = dominio(t), idx = DOMINIOS.indexOf(dom), liberada = p.nen.controle >= t.min;
    const linha = el("div", "", "linha"), acoes = el("div", "", "acoes");
    const ativa = t.dura && t.nome in p.nen.ativas;
    linha.append(el("strong", `${t.nome} · ${dom}${ativa ? " · ATIVA" : ""}`),
      el("p", `Controle ${t.min}+ · custo ${t.custo} PA. ${t.nota}`, "suave"));
    if (!liberada) linha.append(el("p", `Bloqueada: precisa de Controle de Nen ${t.min}.`, "aviso"));
    if (liberada && idx < 3) acoes.append(botao(`${["Aprender","Treinar","Especializar"][idx]} (${CUSTO_DOMINIO[idx]} PE)`, () => evoluir(t, idx), "sec"));
    if (liberada && ativa) acoes.append(botao(`Encerrar ${t.nome}`, () => encerrar(t), "sec"));
    else if (liberada && t.custo > 0 && idx > 0) acoes.append(botao(`Usar ${t.nome}`, () => usar(t)));
    linha.append(acoes);
    $("tecnicas").append(linha);
  });
}

$("evoluirControle").addEventListener("click", evoluirControle);
$("descansar").addEventListener("click", () => {
  p.nen.paAtual = max; p.nen.ativas = {}; p.pvAtual = null; p.rodada = 1; p.habilidades.forEach(h => h.ativaDesde = null); $("msg").textContent = "PA e PV restaurados."; salvar(p); desenhar();
});
iniciarRodadas(p, desenhar);
criarChama($("chama"));
iniciarCorAura(p);
desenhar();