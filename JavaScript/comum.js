// Dados e funções usados por todas as páginas
const ATRIBUTOS = ["Força","Agilidade","Vigor","Intelecto","Percepção","Presença"];
const PERICIAS = ["Luta","Armas brancas","Armas de fogo","Esquiva","Atletismo",
  "Investigação","Medicina","Tecnologia","História","Estratégia",
  "Sobrevivência","Furtividade","Rastreamento","Prestidigitação",
  "Persuasão","Intimidação","Enganação","Intuição","Empatia"];
const CHAVE = "hunterPersonagem"; // nome do "espaço" no localStorage

function novoPersonagem() {
  const p = { nome:"", idade:"", origem:"", periciaOrigem:"", ocupacao:"", tipoNen:"", historia:"",
    criado:false, pe:0, // criado: criação finalizada; pe: Pontos de Evolução disponíveis
    atributos:{}, pericias:{}, nen:{ controle:1, paAtual:null, tecnicas:{} } };
  ATRIBUTOS.forEach(a => p.atributos[a] = 1);
  PERICIAS.forEach(s => p.pericias[s] = 0);
  return p;
}
function carregar() {
  try { return Object.assign(novoPersonagem(), JSON.parse(localStorage.getItem(CHAVE))); }
  catch { return novoPersonagem(); }
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