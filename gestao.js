/* Funções compartilhadas para manter a trilha de auditoria da fila. */
window.statusFila = {
  fila: "Aguardando", aguardando: "Aguardando", em_atendimento: "Em atendimento",
  atendido: "Atendida", cancelado: "Cancelada", desistente: "Desistência"
};
window.registrarHistorico = async function (id, acao, detalhes = {}) {
  const senha = await db.collection("fila_juridica").doc(id).get();
  if (!senha.exists) throw new Error("Senha não encontrada");
  const dados = senha.data();
  const evento = {
    senhaId: id, senha: dados.senha, acao, detalhes,
    data: Date.now(), dataHora: new Date().toISOString()
  };
  await db.collection("historico_juridico").add(evento);
  return dados;
};
window.alterarStatusSenha = async function (id, status, detalhes = {}) {
  const ref = db.collection("fila_juridica").doc(id);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new Error("Senha não encontrada");
    transaction.update(ref, { status, atualizadoEm: Date.now(), ...detalhes });
    transaction.set(db.collection("historico_juridico").doc(), {
      senhaId: id, senha: snap.data().senha, acao: status, detalhes,
      data: Date.now(), dataHora: new Date().toISOString()
    });
  });
};
window.exportarCSV = function (nome, linhas) {
  const chaves = [...new Set(linhas.flatMap((linha) => Object.keys(linha)))];
  const escape = (valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
  const csv = [chaves.map(escape).join(";"), ...linhas.map((linha) => chaves.map((chave) => escape(linha[chave])).join(";"))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${nome}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

window.chamarProximaSenha = async function () {
  const snap = await db.collection("fila_juridica").orderBy("data").get();
  const proxima = snap.docs.find((doc) => ["fila", "aguardando"].includes(doc.data().status));
  if (!proxima) return alert("Não há senhas aguardando.");
  await alterarStatusSenha(proxima.id, "em_atendimento", { chamadaEm: Date.now() });
};
window.cancelarSenha = async function (id, desistente = false) {
  const motivo = prompt(desistente ? "Motivo da desistência:" : "Motivo do cancelamento:");
  if (!motivo || !motivo.trim()) return;
  await alterarStatusSenha(id, desistente ? "desistente" : "cancelado", {
    motivo: motivo.trim(), canceladaEm: Date.now()
  });
};
window.reativarSenha = async function (id) {
  await alterarStatusSenha(id, "fila", { reativadaEm: Date.now() });
};
window.finalizarAtendimento = async function (id) {
  const observacoes = prompt("Observações do atendimento (opcional):") || "";
  await alterarStatusSenha(id, "atendido", { atendidaEm: Date.now(), observacoes });
};
window.publicarRecado = async function () {
  const texto = prompt("Recado para a Tela Pública:");
  if (!texto || !texto.trim()) return;
  await db.collection("configuracoes").doc("tela_publica").set({ recado: texto.trim(), atualizadoEm: Date.now() }, { merge: true });
};
window.definirAlmoco = async function () {
  const horario = prompt("Informe o horário de almoço (ex.: 12:00 às 13:00). Deixe vazio para remover:");
  await db.collection("configuracoes").doc("tela_publica").set({ almoco: (horario || "").trim(), atualizadoEm: Date.now() }, { merge: true });
};
