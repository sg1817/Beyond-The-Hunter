// Dados e funções usados por todas as páginas
const ATRIBUTOS = ["Força","Agilidade","Vigor","Intelecto","Percepção","Presença"];
const PERICIAS = ["Luta","Armas brancas","Armas de fogo","Esquiva","Atletismo",
  "Investigação","Medicina","Tecnologia","História","Estratégia",
  "Sobrevivência","Furtividade","Rastreamento","Prestidigitação",
  "Persuasão","Intimidação","Enganação","Intuição","Empatia"];
const CHAVE = "hunterPersonagem"; // nome do "espaço" no localStorage

function novoPersonagem() {
  const p = { nome:"", idade:"", origem:"", periciaOrigem:"", justZero:"", ocupacao:"", tipoNen:"", historia:"",
    criado:false, pe:0, rodada:1, pvAtual:null, ataques:[], habilidades:[], // criado: criação finalizada; pe: Pontos de Evolução disponíveis
    atributos:{}, pericias:{}, nen:{ controle:1, paAtual:null, tecnicas:{} } };
  ATRIBUTOS.forEach(a => p.atributos[a] = 1);
  PERICIAS.forEach(s => p.pericias[s] = 0);
  return p;
}
function carregar() {
  try { return sanear(Object.assign(novoPersonagem(), JSON.parse(localStorage.getItem(CHAVE)))); }
  catch { return novoPersonagem(); }
}
// Mantém tudo dentro dos limites do sistema (vale também para arquivos importados)
function sanear(p) {
  const lim = (v, a, b) => Math.min(b, Math.max(a, Math.floor(Number(v)) || 0));
  ATRIBUTOS.forEach(a => p.atributos[a] = lim(p.atributos[a], 0, 5));
  PERICIAS.forEach(s => p.pericias[s] = lim(p.pericias[s], 0, 5));
  p.nen = Object.assign({ controle: 1, paAtual: null, tecnicas: {}, ativas: {} }, p.nen);
  p.nen.controle = lim(p.nen.controle, 1, 5);
  p.pe = lim(p.pe, 0, 9999);
  p.rodada = lim(p.rodada, 1, 999);
  p.pvAtual = p.pvAtual == null ? null : lim(p.pvAtual, 0, 999);
  return p;
}
function salvar(p) { localStorage.setItem(CHAVE, JSON.stringify(p)); }

// Fórmulas do sistema
function pvMax(p) { return 10 + p.atributos["Vigor"] * 3; }
function paMax(p) { return 10 + p.atributos["Vigor"] * 2; }

// Origens: benefício e complicação são texto de mesa; a perícia ganha +1 grátis
const ORIGENS = {
  "Família de assassinos": { beneficio:"+1 dado em furtividade ou assassinato.", pericias:["Furtividade"], complicacao:"Família com expectativas perigosas." },
  "Sobrevivente de uma tragédia": { beneficio:"+1 dado para resistir à intimidação.", pericias:["Investigação"], complicacao:"Dificuldade em abandonar a busca por vingança ou justiça." },
  "Criado na natureza": { beneficio:"+1 dado em testes de sobrevivência.", pericias:["Rastreamento"], complicacao:"Pouca familiaridade com costumes sociais." },
  "Estudante ou acadêmico": { beneficio:"+1 dado em testes de conhecimento.", pericias:["Medicina","Tecnologia"], complicacao:"Dificuldade em situações de combate." },
  "Criminoso ou integrante de gangue": { beneficio:"+1 dado em intimidação.", pericias:["Luta","Enganação"], complicacao:"Pode ter inimigos ou dívidas." },
  "Investigador particular": { beneficio:"+1 dado em testes de investigação.", pericias:["Investigação"], complicacao:"Algumas pessoas não gostam de suas investigações." },
  "Outra (combinar com o mestre)": { beneficio:"Definido com o mestre.", pericias:[], complicacao:"Definida com o mestre." }
};

// Nível real da perícia = pontos investidos + bônus da origem
function nivelPericia(p, nome) {
  return p.pericias[nome] + (p.periciaOrigem === nome ? 1 : 0);
}

// ---------- Rolagem (usada em dados, combate e habilidades) ----------
function rolarDados(qtd) {
  const dados = [];
  for (let i = 0; i < qtd; i++) dados.push(Math.floor(Math.random() * 6) + 1);
  return { dados, sucessos: dados.filter(d => d >= 5).length };
}
function ajusteVantagem(vant, desv) { // as duas marcadas se anulam
  if (vant && !desv) return 2;
  if (desv && !vant) return -2;
  return 0;
}
function mostrarDados(r) {
  return r.dados.map(d => `<span class="dado ${d >= 5 ? "ok" : ""}">${d}</span>`).join("");
}

// Catálogo de armas (valores-base experimentais do sistema)
const ARMAS = [
  { nome:"Katana", dano:3, alcance:"Corpo a corpo", tipo:"Corte", pericia:"Armas brancas", atributo:"Agilidade" },
  { nome:"Kunai", dano:1, alcance:"Corpo a corpo", tipo:"Perfurante", pericia:"Armas brancas", atributo:"Agilidade" },
  { nome:"Corrente", dano:2, alcance:"Médio", tipo:"Contundente", pericia:"Armas brancas", atributo:"Força" },
  { nome:"Revólver", dano:4, alcance:"Longo", tipo:"Perfurante", pericia:"Armas de fogo", atributo:"Percepção" },
  { nome:"Bastão", dano:2, alcance:"Médio", tipo:"Contundente", pericia:"Armas brancas", atributo:"Força" }
];

// ---------- Ajudantes de tela ----------
function el(tag, texto, cls) { // cria elemento com texto seguro (textContent)
  const e = document.createElement(tag);
  if (texto) e.textContent = texto;
  if (cls) e.className = cls;
  return e;
}
function botao(texto, fn, cls) {
  const b = el("button", texto, cls);
  b.addEventListener("click", fn);
  return b;
}

// Lista com filtro e formulário em <dialog> (padrão do site Cris)
// cfg: vazio(), preencher(item), ler(), validar(item), card(item, card, acoes)
function iniciarLista(p, chave, cfg) {
  const $ = id => document.getElementById(id);
  let editando = -1; // -1 = item novo
  function desenhar(animar) {
    let n = 0;
    const f = $("filtro").value.toLowerCase();
    $("lista").innerHTML = "";
    p[chave].forEach((item, i) => {
      if (!item.nome.toLowerCase().includes(f)) return;
      const card = el("div", "", "card"), acoes = el("div", "", "acoes");
      if (animar) { card.classList.add("entra"); card.style.animationDelay = (n++ * 0.06) + "s"; }
      cfg.card(item, card, acoes);
      acoes.append(botao("Editar", () => abrir(i), "sec"), botao("Excluir", () => {
        if (confirm("Excluir " + item.nome + "?")) { p[chave].splice(i, 1); salvar(p); desenhar(); }
      }, "sec"));
      card.append(acoes);
      $("lista").append(card);
    });
  }
  function abrir(i) {
    const bloqueio = cfg.bloqueio && cfg.bloqueio(i); // regra que impede abrir o formulário
    if (bloqueio) { (cfg.aviso || alert)(bloqueio); return; }
    editando = i;
    $("erro").textContent = "";
    cfg.preencher(i >= 0 ? p[chave][i] : cfg.vazio());
    $("dlg").showModal();
  }
  $("adicionar").addEventListener("click", () => abrir(-1));
  $("cancelar").addEventListener("click", () => $("dlg").close());
  $("filtro").addEventListener("input", () => desenhar());
  $("form").addEventListener("submit", e => {
    e.preventDefault();
    const item = cfg.ler(), erro = cfg.validar(item);
    if (erro) { $("erro").textContent = erro; return; }
    const custo = cfg.custoPE ? cfg.custoPE(item, editando >= 0 ? p[chave][editando] : null) : 0;
    if (custo > p.pe) { $("erro").textContent = `PE insuficiente: custa ${custo} PE e você tem ${p.pe}.`; return; }
    p.pe -= custo;
    if (editando >= 0) p[chave][editando] = item; else p[chave].push(item);
    salvar(p); $("dlg").close(); desenhar(true);
    if (cfg.aposSalvar) cfg.aposSalvar();
  });
  desenhar(true);
  return { desenhar };
}

// ---------- Animações ----------
// Animações seguem o sistema, mas o jogador pode forçar ligado/desligado (na página inicial)
const PREF_ANIM = "hunterAnimacoes"; // "ligadas", "desligadas" ou vazio (seguir o sistema)
function reduzirMovimento() {
  let pref = "";
  try { pref = localStorage.getItem(PREF_ANIM) || ""; } catch {}
  if (pref === "ligadas") return false;
  if (pref === "desligadas") return true;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
document.documentElement.classList.toggle("sem-animacao", reduzirMovimento());

function revelar(span, valor) { // mostra o resultado final do dado; 5 e 6 acendem
  span.textContent = valor;
  span.className = "dado" + (valor >= 5 ? " ok brilho" : "");
}
// Dados giram por ~0,6 s e depois são revelados um a um. Devolve uma Promise
function animarDados(caixa, r) {
  caixa.innerHTML = "";
  caixa.setAttribute("aria-hidden", "true"); // o resultado em texto é lido pelo parágrafo de resumo
  const spans = r.dados.map(() => { const s = el("span", "?", "dado girando"); caixa.append(s); return s; });
  if (!spans.length) return Promise.resolve();
  if (reduzirMovimento()) { spans.forEach((s, i) => revelar(s, r.dados[i])); return Promise.resolve(); }
  const giro = setInterval(() => spans.forEach(s => s.textContent = 1 + Math.floor(Math.random() * 6)), 70);
  return new Promise(pronto => setTimeout(() => {
    clearInterval(giro);
    spans.forEach((s, i) => setTimeout(() => { revelar(s, r.dados[i]); if (i === spans.length - 1) pronto(); }, i * 110));
  }, 600));
}
// Faz um número "contar" de um valor até outro (ex.: aura gasta)
function contar(elemento, de, para, formato) {
  formato = formato || (v => v);
  if (de === para || reduzirMovimento()) { elemento.textContent = formato(para); return; }
  const inicio = performance.now();
  elemento.classList.remove("pisca"); void elemento.offsetWidth; elemento.classList.add("pisca");
  (function passo(agora) {
    const t = Math.min(1, (agora - inicio) / 400);
    elemento.textContent = formato(Math.round(de + (para - de) * t));
    if (t < 1) requestAnimationFrame(passo);
  })(inicio);
}
// Estado pela porcentagem restante (mesma regra da sobrecarga de aura)
function estadoPorcentagem(atual, max) {
  if (atual === 0) return "Esgotado";
  const pct = atual / max;
  if (pct <= 0.25) return "Exausto";
  if (pct <= 0.5) return "Cansado";
  return "Estável";
}
function atualizarBarra(barra, atual, max, estado) {
  barra.dataset.estado = estado;
  barra.setAttribute("role", "progressbar"); // leitores de tela anunciam o valor
  barra.setAttribute("aria-valuemin", 0);
  barra.setAttribute("aria-valuemax", max);
  barra.setAttribute("aria-valuenow", atual);
  barra.firstElementChild.style.setProperty("--p", max ? atual / max : 0);
}

// ---------- Rodadas e manutenção ----------
// custo de aura e de quantas em quantas rodadas ele é cobrado
const MANUTENCAO = {
  Ten: { custo: 1, cada: 3 }, Ren: { custo: 2, cada: 1 }, In: { custo: 1, cada: 1 },
  En: { custo: 2, cada: 1 }, Shu: { custo: 1, cada: 1 }, Ken: { custo: 2, cada: 1 }, Ryu: { custo: 1, cada: 1 }
};

// Avança uma rodada e cobra a manutenção de tudo que está ativo. Devolve o relatório
function passarRodada(p) {
  if (p.nen.paAtual === null || p.nen.paAtual > paMax(p)) p.nen.paAtual = paMax(p);
  p.rodada += 1;
  const log = [];
  function cobrar(nome, custo, cada, desde, encerrar) {
    const decorrido = p.rodada - desde;
    if (decorrido <= 0 || decorrido % cada !== 0) return;
    if (custo > p.nen.paAtual) { encerrar(); log.push(`${nome} encerrada: aura insuficiente.`); }
    else { p.nen.paAtual -= custo; log.push(`${nome}: manutenção -${custo} PA.`); }
  }
  Object.entries(p.nen.ativas).forEach(([nome, desde]) => {
    const m = MANUTENCAO[nome];
    if (m) cobrar(nome, m.custo, m.cada, typeof desde === "number" ? desde : p.rodada, () => delete p.nen.ativas[nome]);
  });
  p.habilidades.forEach(h => {
    if (h.manutencao > 0 && h.ativaDesde != null) cobrar(h.nome, h.manutencao, 1, h.ativaDesde, () => h.ativaDesde = null);
  });
  if (!log.length) log.push("Nenhuma manutenção nesta rodada.");
  salvar(p);
  return log;
}

// Liga os botões da seção "Rodada" (ids: rodadaTxt, proximaRodada, zerarRodada, logRodada)
function iniciarRodadas(p, aoMudar) {
  const $ = id => document.getElementById(id);
  const mostrar = () => $("rodadaTxt").textContent = p.rodada;
  $("proximaRodada").addEventListener("click", () => {
    $("logRodada").replaceChildren(...passarRodada(p).map(t => el("p", t, "suave")));
    mostrar(); aoMudar();
  });
  $("zerarRodada").addEventListener("click", () => {
    if (!confirm("Encerrar o combate e voltar para a rodada 1?")) return;
    p.rodada = 1;
    Object.keys(p.nen.ativas).forEach(n => p.nen.ativas[n] = 1);
    p.habilidades.forEach(h => { if (h.ativaDesde != null) h.ativaDesde = 1; });
    salvar(p); $("logRodada").replaceChildren(); mostrar(); aoMudar();
  });
  mostrar();
}

// Menu rolável no celular: deixa a página atual visível
const paginaAtual = document.querySelector("nav a.ativo");
if (paginaAtual) paginaAtual.scrollIntoView({ inline: "center", block: "nearest" });