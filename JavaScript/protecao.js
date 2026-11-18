
import { supabase } from "./supabase.js";

// Verifica se existe uma sessão ativa
async function verificarAcesso() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        window.location.replace("./login.html");
        return;
    }

    console.log("Usuário autenticado:", data.session.user.email);
}

// Executa a verificação
verificarAcesso();

// Detecta quando o usuário sai da conta
supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
        window.location.replace("./login.html");
    }
});

// Função para sair da conta
async function sairDaConta() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("Não foi possível sair da conta: " + error.message);
        return;
    }

    window.location.replace("./login.html");
}

// Disponibiliza a função para os botões da página
window.sairDaConta = sairDaConta;
