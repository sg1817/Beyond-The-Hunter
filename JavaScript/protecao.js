import { supabase } from "./supabase.js";
import "./nuvem.js"; // sincroniza o personagem com a conta em todas as páginas protegidas

const LOGIN = "./login.html";

// Páginas internas: sem sessão ativa, volta para o login.
async function verificarAcesso() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            window.location.replace(LOGIN);
            return;
        }

        // Mostra o e-mail da conta, se a página tiver esse espaço (#contaEmail)
        const campo = document.getElementById("contaEmail");
        if (campo) campo.textContent = data.session.user.email;
    } catch {
        window.location.replace(LOGIN);
    }
}
verificarAcesso();

// Quando a conta sai (em qualquer aba), volta para o login
supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.replace(LOGIN);
});

async function sairDaConta() {
    // 1. envia para a conta o que ainda não foi enviado
    if (window.sincronizarAgora) {
        const ok = await window.sincronizarAgora();
        if (!ok && !confirm("Não foi possível salvar o personagem na conta agora.\nSair mesmo assim? As alterações deste aparelho serão perdidas.")) return;
    }

    // 2. limpa o aparelho, para a próxima conta não ver este personagem
    localStorage.removeItem("hunterPersonagem");
    localStorage.removeItem("hunterNuvem");

    // 3. sai
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert("Não foi possível sair da conta: " + error.message);
        return;
    }
    window.location.replace(LOGIN);
}
window.sairDaConta = sairDaConta;

// Qualquer botão com data-sair faz logout
document.querySelectorAll("[data-sair]").forEach(b => b.addEventListener("click", sairDaConta));