const $ = id => document.getElementById(id);
const p = carregar();
const TIPOS = ["Reforço","Transformação","Emissão","Materialização","Manipulação","Especialização"];
// [nome, pontos]: efeitos gastam pontos de construção; limitações devolvem pontos
const EFEITOS = [["Efeito simples",1],["Efeito moderado",2],["Efeito complexo",3],["Efeito extraordinário",4],["Efeito extremamente poderoso",5]];
const LIMITES = [["Limitação leve",1],["Limitação moderada",2],["Limitação severa",3],["Sacrifício extremo",4]];
const CUSTO_NOVA = 5, CUSTO_MELHORA = 3; // PE: criar e aprimorar
const estrutura = h => JSON.stringify([h.tipo, h.custoAura, h.manutencao || 0, h.efeitos, h.limites]);
let atual = null; // habilidade aberta no formulário (para manter se está ativa)
const BASE = 5; // pontos de construção iniciais
const TEXTOS = ["nome","tipo","secundarios","descricao","ativacao","alcance","duracao","condicoes"];

const soma = (qtds, tabela) => qtds.reduce((t, q, i) => t + q * tabela[i][1], 0);
const custoPts = h => soma(h.efeitos, EFEITOS);
const orcamento = h => BASE + soma(h.limites, LIMITES);

if (p.nen.paAtual === null || p.nen.paAtual > paMax(p)) p.nen.paAtual = paMax(p);
const mostrarPA = () => $("paAtual").textContent = `Aura ${p.nen.paAtual}/${paMax(p)} · PE ${p.pe} · Controle ${p.nen.controle}`;
mostrarPA();

TIPOS.forEach(t => $("tipo").add(new Option(t, t)));
function criarCampos(idCaixa, tabela, prefixo) {
  tabela.forEach(([nome], i) => {
    const rot = el("label", nome), campo = el("input");
    campo.type = "number"; campo.min = 0; campo.max = 5; campo.id = prefixo + i;
    rot.append(campo);
    $(idCaixa).append(rot);
  });
}
criarCampos("efeitos", EFEITOS, "ef");
criarCampos("limites", LIMITES, "li");
const lerQtds = (prefixo, n) => Array.from({ length: n }, (_, i) => Math.max(0, Number($(prefixo + i).value) || 0));

function lerHab() {
  const h = {};
  TEXTOS.forEach(c => h[c] = $(c).value);
  h.custoAura = Number($("custoAura").value) || 0;
  h.manutencao = Math.max(0, Math.floor(Number($("manutencao").value)) || 0);
  h.ativaDesde = atual ? (atual.ativaDesde ?? null) : null;
  h.efeitos = lerQtds("ef", EFEITOS.length);
  h.limites = lerQtds("li", LIMITES.length);
  return h;
}
function mostrarPontos() {
  const h = lerHab(), c = custoPts(h), o = orcamento(h);
  $("pontos").textContent = `Pontos de construção: custo ${c} / orçamento ${o}`;
  $("pontos").classList.toggle("aviso", c > o);
}
$("form").addEventListener("input", mostrarPontos);

function usar(h) {
  if (h.custoAura > p.nen.paAtual) { $("msg").textContent = `PA insuficiente para ${h.nome}.`; return; }
  p.nen.paAtual -= h.custoAura;
  if (h.manutencao > 0) h.ativaDesde = p.rodada; // passa a cobrar manutenção por rodada
  $("msg").textContent = `${h.nome} usada (-${h.custoAura} PA).`;
  salvar(p); mostrarPA(); lista.desenhar();
}
function encerrar(h) {
  h.ativaDesde = null;
  $("msg").textContent = `${h.nome} encerrada.`;
  salvar(p); lista.desenhar();
}

const lista = iniciarLista(p, "habilidades", {
  aviso: t => $("msg").textContent = t,
  bloqueio: i => (i < 0 && p.nen.controle < 2) ? "Criar habilidades exige Controle de Nen 2 ou mais. Evolua o Controle na aba Nen." : "",
  // Nova custa 5 PE; mudar a estrutura de uma existente custa 3 PE (texto é grátis)
  custoPE: (nova, antiga) => !antiga ? CUSTO_NOVA : (estrutura(nova) !== estrutura(antiga) ? CUSTO_MELHORA : 0),
  aposSalvar: mostrarPA,
  vazio: () => ({ nome:"", tipo:TIPOS[0], secundarios:"", descricao:"", ativacao:"", alcance:"", duracao:"", custoAura:1, efeitos:[0,0,0,0,0], limites:[0,0,0,0], condicoes:"", manutencao:0, ativaDesde:null }),
  preencher(h) {
    atual = h;
    TEXTOS.forEach(c => $(c).value = h[c]);
    $("custoAura").value = h.custoAura;
    $("manutencao").value = h.manutencao || 0;
    h.efeitos.forEach((q, i) => $("ef" + i).value = q);
    h.limites.forEach((q, i) => $("li" + i).value = q);
    mostrarPontos();
  },
  ler: lerHab,
  validar(h) {
    if (!h.nome.trim()) return "Dê um nome à habilidade.";
    if (h.custoAura < 1) return "O custo mínimo de uma habilidade é 1 PA.";
    if (custoPts(h) === 0) return "Escolha ao menos um efeito.";
    if (custoPts(h) > orcamento(h)) return "O custo passou do orçamento. Reduza efeitos ou adicione limitações.";
    if (h.limites.some(q => q > 0) && !h.condicoes.trim()) return "Descreva as condições e restrições: elas não podem ser só decorativas.";
    // O Controle de Nen limita a complexidade: efeito de grau N exige Controle N
    const alto = h.efeitos.findIndex((q, i) => q > 0 && i + 1 > p.nen.controle);
    if (alto >= 0) return `${EFEITOS[alto][0]} exige Controle de Nen ${alto + 1}. O seu é ${p.nen.controle}.`;
    if (p.nen.controle < 3 && h.efeitos.reduce((a, q) => a + q, 0) > 1) return "Com Controle abaixo de 3, a habilidade só pode ter um efeito.";
    return "";
  },
  card(h, card, acoes) {
    card.append(el("strong", h.nome),
      el("p", `${h.tipo}${h.secundarios ? " + " + h.secundarios : ""} · ${h.custoAura} PA · pontos ${custoPts(h)}/${orcamento(h)}${h.manutencao ? ` · manutenção ${h.manutencao} PA/rodada` : ""}${h.ativaDesde != null ? " · ATIVA" : ""}`, "suave"));
    if (h.descricao) card.append(el("p", h.descricao));
    const det = [["Ativação", h.ativacao], ["Alcance", h.alcance], ["Duração", h.duracao]]
      .filter(d => d[1]).map(d => `${d[0]}: ${d[1]}`).join(" · ");
    if (det) card.append(el("p", det, "suave"));
    if (h.condicoes) card.append(el("p", "Condições e restrições: " + h.condicoes, "suave"));
    if (h.ativaDesde != null) acoes.append(botao("Encerrar", () => encerrar(h), "sec"));
    else acoes.append(botao(`Usar (-${h.custoAura} PA)`, () => usar(h)));
  }
});

iniciarRodadas(p, () => { mostrarPA(); lista.desenhar(); });