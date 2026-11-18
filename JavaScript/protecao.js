import { supabase } from "./supabase.js";

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