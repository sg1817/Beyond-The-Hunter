
import { supabase } from "./supabase.js";

const authForm = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const nameGroup = document.getElementById("nameGroup");
const submitButton = document.getElementById("submitButton");
const message = document.getElementById("message");

let isRegistering = false;

// Alternar entre login e cadastro
loginTab.addEventListener("click", () => {
    isRegistering = false;

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    nameGroup.classList.add("hidden");
    submitButton.textContent = "Entrar";
    message.textContent = "";
});

registerTab.addEventListener("click", () => {
    isRegistering = true;

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    nameGroup.classList.remove("hidden");
    submitButton.textContent = "Criar conta";
    message.textContent = "";
});

emailRedirectTo:
    window.location.origin + "/html/index.html"

// Enviar formulário
authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value.trim();

    message.textContent = "Aguarde...";
    submitButton.disabled = true;

    try {

        if (isRegistering) {

            if (!name) {
                throw new Error("Informe seu nome de usuário.");
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: name
                    },
                    emailRedirectTo:
                        window.location.origin + "/html/index.html"
                }
            });

            if (error) throw error;

            if (data.session) {
                window.location.href = "./index.html";
            } else {
                message.textContent =
                    "Conta criada! Verifique seu e-mail para confirmar o cadastro.";
            }

        } else {

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            message.textContent = "Login realizado!";
            window.location.href = "./index.html";
        }

    } catch (error) {

        message.textContent = error.message;

    } finally {

        submitButton.disabled = false;

    }
});
