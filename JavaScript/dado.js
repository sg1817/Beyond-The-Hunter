const $ = id => document.getElementById(id);
const p = carregar();

// ---------- Regras do sistema ----------
// Rola N dados de 6 faces; 5 ou 6 contam como sucesso
function rolarDados(qtd) {
  const dados = [];
  for (let i = 0; i < qtd; i++) dados.push(Math.floor(Math.random() * 6) + 1);
  return { dados, sucessos: dados.filter(d => d >= 5).length };
}
// Vantagem +2 dados, desvantagem -2; se tiver as duas, se anulam
function ajusteVantagem(vant, desv) {
  if (vant && !desv) return 2;
  if (desv && !vant) return -2;
  return 0;
}
function mostrarDados(r) {
  return r.dados.map(d => `<span class="dado ${d >= 5 ? "ok" : ""}">${d}</span>`).join("");
}

// ---------- Preenche as listas com os valores da ficha ----------
ATRIBUTOS.forEach(a => $("atributo").add(new Option(`${a} (${p.atributos[a]})`, p.atributos[a])));
$("pericia").add(new Option("Sem perícia", 0));
PERICIAS.forEach(s => $("pericia").add(new Option(`${s} (${nivelPericia(p, s)})`, nivelPericia(p, s))));

// ---------- Rolagem ----------
$("rolar").addEventListener("click", () => {
  const base = Number($("atributo").value) + Number($("pericia").value);
  const total = Math.max(0, base + ajusteVantagem($("vant").checked, $("desv").checked));
  const r = rolarDados(total);
  $("resultado").innerHTML = `<p>${total}D6: <strong>${r.sucessos}</strong> sucesso(s)</p><div>${mostrarDados(r)}</div>`;
});