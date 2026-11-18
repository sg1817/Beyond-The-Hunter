import { supabase } from "./supabase.js";

const PAINEL = "./painel.html";
const $ = id => document.getElementById(id);
const authForm = $("authForm");
const loginTab = $("loginTab");
const registerTab = $("registerTab");
const nameGroup = $("nameGroup");
const submitButton = $("submitButton");
const message = $("message");
const password = $("password");

let isRegistering = false;

// Quem já está logado vai direto para o painel.
// Só redireciona quando EXISTE sessão; a proteção das outras páginas só manda
// para o login quando NÃO existe. As duas condições nunca são verdadeiras juntas,
// por isso não há mais loop entre login e painel.
(async () => {
    try {
        const { data } = await supabase.auth.getSession();
        if (data.session) window.location.replace(PAINEL);
    } catch {
        // sem conexão: continua na tela de login
    }
})();

// Alternar entre login e cadastro
function trocarModo(registrar) {
    isRegistering = registrar;

    loginTab.classList.toggle("active", !registrar);
    registerTab.classList.toggle("active", registrar);
    loginTab.setAttribute("aria-pressed", String(!registrar));
    registerTab.setAttribute("aria-pressed", String(registrar));

    nameGroup.classList.toggle("hidden", !registrar);
    password.autocomplete = registrar ? "new-password" : "current-password";
    submitButton.textContent = registrar ? "Criar conta" : "Entrar";
    message.textContent = "";
}

loginTab.addEventListener("click", () => trocarModo(false));
registerTab.addEventListener("click", () => trocarModo(true));

// Mensagens do Supabase em português
function traduzir(texto) {
    const t = (texto || "").toLowerCase();
    if (t.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (t.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
    if (t.includes("already registered")) return "Este e-mail já está cadastrado.";
    if (t.includes("at least 6")) return "A senha precisa ter pelo menos 6 caracteres.";
    if (t.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    if (t.includes("failed to fetch")) return "Sem conexão com o servidor. Verifique sua internet.";
    return texto;
}

// Enviar formulário
authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("email").value.trim();
    const senha = password.value;
    const name = $("name").value.trim();

    message.textContent = "Aguarde...";
    submitButton.disabled = true;

    try {
        if (isRegistering) {
            if (!name) throw new Error("Informe seu nome de usuário.");

            const { data, error } = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: { display_name: name },
                    // volta para o painel, na mesma pasta desta página
                    emailRedirectTo: new URL("painel.html", window.location.href).href
                }
            });

            if (error) throw error;

            if (data.session) {
                window.location.replace(PAINEL);
                return;
            }
            message.textContent = "Conta criada! Verifique seu e-mail para confirmar o cadastro.";
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
            if (error) throw error;

            message.textContent = "Login realizado!";
            window.location.replace(PAINEL);
            return;
        }
    } catch (error) {
        message.textContent = traduzir(error.message);
    }

    submitButton.disabled = false;
});