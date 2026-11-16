const $ = id => document.getElementById(id);
const p = carregar();

// ---------- Preenche as listas com os valores da ficha ----------
ATRIBUTOS.forEach(a => $("atributo").add(new Option(`${a} (${p.atributos[a]})`, p.atributos[a])));
$("pericia").add(new Option("Sem perícia", 0));
PERICIAS.forEach(s => $("pericia").add(new Option(`${s} (${nivelPericia(p, s)})`, nivelPericia(p, s))));

// ---------- Rolagem ----------
let rolando = false; // evita rolar de novo no meio da animação
$("rolar").addEventListener("click", () => {
  if (rolando) return;
  rolando = true;
  const base = Number($("atributo").value) + Number($("pericia").value);
  const total = Math.max(0, base + ajusteVantagem($("vant").checked, $("desv").checked));
  const r = rolarDados(total);
  const info = el("p", `Rolando ${total}D6...`), caixa = el("div");
  $("resultado").replaceChildren(info, caixa);
  animarDados(caixa, r).then(() => {
    info.textContent = `${total}D6: ${r.sucessos} sucesso(s)`;
    rolando = false;
  });
});