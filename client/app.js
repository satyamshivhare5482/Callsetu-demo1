let token = sessionStorage.getItem("cs_token") || "";
let socket;
const $ = id => document.getElementById(id);
async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function showApp(id) {
  $("auth").hidden = true; $("app").hidden = false; $("accountId").textContent = "CallSetu ID: " + id;
  connectSocket();
}
function connectSocket() {
  if (!token || !window.io) return;
  socket = io({ auth: { token } });
  socket.on("connect", () => $("connection").textContent = "Connected");
  socket.on("disconnect", () => $("connection").textContent = "Disconnected");
  socket.on("connect_error", () => $("connection").textContent = "Offline");
  socket.on("message:new", msg => {
    const p = document.createElement("p");
    p.textContent = "Encrypted message from " + msg.from + " received";
    $("messageList").prepend(p);
  });
}
async function authAction(kind) {
  $("authError").textContent = "";
  try {
    const result = await api("/" + kind, { method: "POST", body: JSON.stringify({ id: $("userId").value.trim(), password: $("password").value }) });
    token = result.token; sessionStorage.setItem("cs_token", token); showApp(result.id);
  } catch (e) { $("authError").textContent = e.message; }
}
$("login").onclick = () => authAction("login");
$("register").onclick = () => authAction("register");
document.querySelectorAll("nav [data-tab]").forEach(btn => btn.onclick = () => {
  ["messages","contacts","dial","account"].forEach(id => $(id).hidden = id !== btn.dataset.tab);
});
$("logout").onclick = async () => {
  try { await api("/logout", { method: "POST" }); } catch {}
  if (socket) socket.disconnect();
  token = ""; sessionStorage.removeItem("cs_token"); $("app").hidden = true; $("auth").hidden = false;
};
$("addContact").onclick = async () => {
  try { await api("/contacts", { method: "POST", body: JSON.stringify({ id: $("contactId").value.trim(), label: $("contactLabel").value.trim() }) }); await loadContacts(); }
  catch (e) { alert(e.message); }
};
async function loadContacts() {
  const list = await api("/contacts"); $("contactList").replaceChildren();
  list.forEach(c => { const li = document.createElement("li"); li.textContent = c.label + " (" + c.id + ")"; $("contactList").append(li); });
}
$("sendMessage").onclick = () => {
  $("messageList").prepend(Object.assign(document.createElement("p"), { textContent: "Encryption is not yet wired: do not send private content in this prototype." }));
};
(async function restore() {
  if (!token) return;
  try { const me = await api("/me"); showApp(me.id); await loadContacts(); }
  catch { token = ""; sessionStorage.removeItem("cs_token"); }
})();