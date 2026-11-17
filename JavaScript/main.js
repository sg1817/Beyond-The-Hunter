const sel = document.getElementById("animacoes");
sel.value = localStorage.getItem(PREF_ANIM) || "";
sel.addEventListener("change", () => {
  if (sel.value) localStorage.setItem(PREF_ANIM, sel.value);
  else localStorage.removeItem(PREF_ANIM);
  location.reload(); // recarrega para aplicar
});

// ---------- Resumo do personagem (painel) ----------
const $ = id => document.getElementById(id);
const p = carregar();
const pvTotal = pvMax(p), paTotal = paMax(p);
const pv = p.pvAtual === null ? pvTotal : Math.min(p.pvAtual, pvTotal);
const pa = p.nen.paAtual === null ? paTotal : Math.min(p.nen.paAtual, paTotal);
$("resumoNome").textContent = p.nome || "Seu personagem";
$("rPV").textContent = `${pv} / ${pvTotal}`;
$("rPA").textContent = `${pa} / ${paTotal}`;
$("rRodada").textContent = p.rodada;
$("rPE").textContent = p.pe;
atualizarBarra($("barraPV"), pv, pvTotal, estadoPorcentagem(pv, pvTotal));
atualizarBarra($("barraPA"), pa, paTotal, estadoPorcentagem(pa, paTotal));
criarChama($("chama"));
atualizarChama($("chama"), pa, paTotal, Object.keys(p.nen.ativas).length > 0);