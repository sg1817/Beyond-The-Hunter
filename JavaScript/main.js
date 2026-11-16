const sel = document.getElementById("animacoes");
sel.value = localStorage.getItem(PREF_ANIM) || "";
sel.addEventListener("change", () => {
  if (sel.value) localStorage.setItem(PREF_ANIM, sel.value);
  else localStorage.removeItem(PREF_ANIM);
  location.reload(); // recarrega para aplicar
});