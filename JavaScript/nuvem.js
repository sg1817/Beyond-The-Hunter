// Sincroniza o personagem com a conta (tabela "characters" do Supabase).
//
// Como funciona:
//  - o navegador (localStorage) continua sendo a cópia de trabalho, rápida e offline;
//  - depois de cada mudança, o personagem é enviado para a conta;
//  - ao abrir uma página, o site compara a conta com o aparelho e usa a versão mais nova.
import { supabase } from "./supabase.js";

const LOCAL = "hunterPersonagem"; // mesmo nome usado no comum.js
const META = "hunterNuvem";       // controle: dono, id na nuvem, versão e cópia já enviada
const ATRASO = 2000;              // espera depois da última mudança antes de enviar (ms)

let usuario = null;
let enviando = false;
let temporizador = null;

// ---------- Selo de status (canto da tela) ----------
const selo = document.createElement("div");
selo.id = "statusNuvem";
selo.setAttribute("role", "status");
const estilo = document.createElement("style");
estilo.textContent = "#statusNuvem{position:fixed;right:.6rem;bottom:calc(.6rem + env(safe-area-inset-bottom,0px));z-index:4;padding:.25rem .7rem;border-radius:99px;font-size:.8rem;pointer-events:none;background:var(--painel,#141414);border:1px solid var(--borda,#3d3420);color:var(--suave,#a89f88)}#statusNuvem:empty{display:none}";
document.head.append(estilo);
document.body.append(selo);
const dizer = texto => { selo.textContent = texto; };

// ---------- Utilidades ----------
const lerMeta = () => { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch { return {}; } };
const gravarMeta = meta => localStorage.setItem(META, JSON.stringify(meta));
// "foto" do personagem local, já normalizada pelo comum.js (serve para saber se mudou)
const foto = () => JSON.stringify(carregar());
const ehPadrao = () => !localStorage.getItem(LOCAL) || foto() === JSON.stringify(sanear(novoPersonagem()));

// Depois de trocar os dados locais é preciso recarregar a tela. O contador evita qualquer loop.
function recarregar() {
    const n = Number(sessionStorage.getItem("hunterRecarga") || 0);
    if (n >= 2) { dizer("Atualize a página para ver os dados da conta"); return; }
    sessionStorage.setItem("hunterRecarga", n + 1);
    location.reload();
}
const fim = () => sessionStorage.removeItem("hunterRecarga");

// ---------- Conversa com o Supabase ----------
async function buscar() {
    const { data, error } = await supabase
        .from("characters")
        .select("id, data, updated_at")
        .eq("owner_id", usuario.id)
        .is("campaign_id", null)
        .order("created_at", { ascending: true })
        .limit(1);
    if (error) throw error;
    return data[0] || null;
}

function aplicar(linha) {
    localStorage.setItem(LOCAL, JSON.stringify(linha.data));
    gravarMeta({ dono: usuario.id, id: linha.id, versao: linha.updated_at, base: foto() });
}

async function enviar() {
    if (!usuario) return true;
    while (enviando) await new Promise(r => setTimeout(r, 100));
    const meta = lerMeta();
    if (foto() === meta.base) return true; // nada novo para enviar

    enviando = true;
    dizer("Salvando na conta…");
    let ok = false;
    try {
        const instantaneo = foto();
        const p = carregar();
        const linha = { name: p.nome || "Sem nome", data: p };
        const r = meta.id
            ? await supabase.from("characters").update(linha).eq("id", meta.id).select("id, updated_at").single()
            : await supabase.from("characters").insert({ ...linha, owner_id: usuario.id, campaign_id: null }).select("id, updated_at").single();
        if (r.error) throw r.error;
        gravarMeta({ dono: usuario.id, id: r.data.id, versao: r.data.updated_at, base: instantaneo });
        dizer("Salvo na conta");
        ok = true;
    } catch (erro) {
        console.error("Falha ao salvar na conta:", erro);
        if (erro && erro.code === "PGRST116") gravarMeta({ dono: usuario.id }); // a linha sumiu: cria de novo
        dizer("Sem conexão com a conta: salvo só neste aparelho");
    } finally {
        enviando = false;
    }
    // mudou durante o envio? tenta de novo logo; se falhou, espera mais para não insistir
    if (foto() !== lerMeta().base) agendar(ok ? ATRASO : 30000);
    return ok;
}

function agendar(ms = ATRASO) {
    clearTimeout(temporizador);
    temporizador = setTimeout(enviar, ms);
}

// Usado ao sair da conta: envia o que faltar antes de limpar o aparelho
window.sincronizarAgora = () => { clearTimeout(temporizador); return enviar(); };

// Toda vez que a página salva o personagem, agenda o envio (sem precisar mexer no comum.js)
const salvarOriginal = window.salvar;
window.salvar = function (p) {
    salvarOriginal(p);
    if (usuario) agendar();
};
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && usuario) enviar();
});

// ---------- Conflito: mudou no aparelho E na conta ----------
async function resolverConflito(nuvem) {
    const usarConta = confirm(
        "Seu personagem foi alterado neste aparelho e também na conta.\n\n" +
        "OK = usar a versão da conta (descarta a deste aparelho)\n" +
        "Cancelar = manter a deste aparelho (substitui a da conta)");
    if (usarConta) { aplicar(nuvem); return recarregar(); }
    gravarMeta({ dono: usuario.id, id: nuvem.id, versao: nuvem.updated_at, base: "" }); // força o envio
    await enviar();
    fim();
}

// ---------- Sincronização ao abrir a página ----------
async function iniciar() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return; // sem login: a proteção cuida do redirecionamento
    usuario = data.session.user;
    dizer("Conectando à conta…");

    let meta = lerMeta();
    let trocouDeConta = false;
    if (meta.dono && meta.dono !== usuario.id) { // o personagem local é de OUTRA conta
        localStorage.removeItem(LOCAL);
        localStorage.removeItem(META);
        meta = {};
        trocouDeConta = true;
    }

    const nuvem = await buscar();

    if (!nuvem) { // a conta ainda não tem personagem
        if (trocouDeConta) return recarregar();
        if (!ehPadrao()) await enviar(); else dizer("Conectado à conta");
        return fim();
    }

    if (meta.id === nuvem.id) { // este aparelho já sincronizou com este personagem
        const sujo = foto() !== meta.base;
        const nuvemMudou = nuvem.updated_at !== meta.versao;
        if (!sujo && !nuvemMudou) { dizer("Salvo na conta"); return fim(); }
        if (!sujo && nuvemMudou) { aplicar(nuvem); return recarregar(); }
        if (sujo && !nuvemMudou) { await enviar(); return fim(); }
        return resolverConflito(nuvem);
    }

    // primeiro encontro deste aparelho com o personagem da conta
    if (ehPadrao()) { aplicar(nuvem); return recarregar(); }
    return resolverConflito(nuvem);
}

if (typeof carregar === "function") {
    iniciar().catch(erro => {
        console.error("Falha ao sincronizar:", erro);
        dizer("Sem conexão com a conta: salvo só neste aparelho");
    });
}