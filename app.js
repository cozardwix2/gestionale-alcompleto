import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tfspstvhudgjgwuzioth.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc3BzdHZodWRnamd3dXppb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3Mzg3MzUsImV4cCI6MjA4NDMxNDczNX0.t8lOGqC0R1ZS-SpNehhxsTNUZe1ItkIp1PQCmxPHIMs";

const STATUS_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "rifiutato", label: "Rifiutato" },
  { value: "interessato", label: "Interessato + appuntamento" },
  { value: "confermato", label: "Confermato" },
];

const statusClassMap = {
  rifiutato: "status-rifiutato",
  interessato: "status-interessato",
  confermato: "status-confermato",
};

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const leadForm = document.getElementById("leadForm");
const leadError = document.getElementById("leadError");
const leadTableBody = document.getElementById("leadTableBody");
const tableEmpty = document.getElementById("tableEmpty");
const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const filtroPersona = document.getElementById("filtroPersona");
const caricatoDaSelect = document.getElementById("caricatoDa");
const editingId = document.getElementById("editingId");
const saveLeadBtn = document.getElementById("saveLeadBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const PEOPLE = ["Davide", "Alessio", "Lorenzo"];

function prettyName(email) {
  if (!email) return "";
  const base = email.split("@")[0] || email;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function setView(session) {
  if (session) {
    loginView.hidden = true;
    appView.hidden = false;
    const name = prettyName(session.user.email);
    userLabel.textContent = name;
    if (PEOPLE.includes(name)) {
      caricatoDaSelect.value = name;
    }
  } else {
    loginView.hidden = false;
    appView.hidden = true;
    userLabel.textContent = "Non autenticato";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = "Credenziali non valide.";
    return;
  }
  await loadLeads();
}

async function handleLogout() {
  await client.auth.signOut();
  leadTableBody.innerHTML = "";
  tableEmpty.hidden = false;
}

function clearLeadForm() {
  leadForm.reset();
  editingId.value = "";
  saveLeadBtn.textContent = "Salva lead";
  cancelEditBtn.hidden = true;
}

function startEdit(lead) {
  editingId.value = lead.id;
  document.getElementById("nomeStruttura").value = lead.nome_struttura;
  document.getElementById("telefono").value = lead.telefono;
  document.getElementById("occupazione").value = lead.occupazione;
  document.getElementById("prezzoMedio").value = lead.prezzo_medio;
  document.getElementById("altreStrutture").value = lead.altre_strutture;
  document.getElementById("info").value = lead.info;
  document.getElementById("citta").value = lead.citta;
  document.getElementById("bookingLink").value = lead.booking_link || "";
  caricatoDaSelect.value = lead.caricato_da;
  saveLeadBtn.textContent = "Salva modifiche";
  cancelEditBtn.hidden = false;
  leadForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  leadError.textContent = "";

  const session = (await client.auth.getSession()).data.session;
  if (!session) {
    leadError.textContent = "Devi effettuare il login.";
    return;
  }

  const payload = {
    nome_struttura: document.getElementById("nomeStruttura").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    occupazione: document.getElementById("occupazione").value.trim(),
    prezzo_medio: document.getElementById("prezzoMedio").value.trim(),
    altre_strutture: document.getElementById("altreStrutture").value.trim(),
    info: document.getElementById("info").value.trim(),
    citta: document.getElementById("citta").value.trim(),
    booking_link: document.getElementById("bookingLink").value.trim(),
    caricato_da: caricatoDaSelect.value,
  };

  const isEditing = Boolean(editingId.value);
  let error;
  if (isEditing) {
    ({ error } = await client.from("leads").update(payload).eq("id", editingId.value));
  } else {
    payload.status = "nuovo";
    ({ error } = await client.from("leads").insert(payload));
  }
  if (error) {
    leadError.textContent = "Errore nel salvataggio. Riprova.";
    return;
  }

  clearLeadForm();
  await loadLeads();
}

function renderTableRows(rows) {
  leadTableBody.innerHTML = "";
  if (!rows.length) {
    tableEmpty.hidden = false;
    return;
  }

  tableEmpty.hidden = true;
  rows.forEach((lead) => {
    const tr = document.createElement("tr");
    tr.dataset.id = lead.id;
    if (statusClassMap[lead.status]) {
      tr.classList.add(statusClassMap[lead.status]);
    }

    tr.innerHTML = `
      <td data-label="Struttura">${lead.nome_struttura}</td>
      <td data-label="Telefono">${lead.telefono}</td>
      <td data-label="Occupazione">${lead.occupazione}</td>
      <td data-label="Prezzo medio">${lead.prezzo_medio}</td>
      <td data-label="Altre strutture">${lead.altre_strutture}</td>
      <td data-label="Info">${lead.info}</td>
      <td data-label="Città">${lead.citta}</td>
      <td data-label="Booking">${
        lead.booking_link
          ? `<a href="${lead.booking_link}" target="_blank" rel="noopener">Apri</a>`
          : ""
      }</td>
      <td data-label="Caricato da">${lead.caricato_da}</td>
      <td data-label="Stato"></td>
      <td data-label="Azioni"></td>
    `;

    const statusCell = tr.querySelector("td:nth-last-child(2)");
    const select = document.createElement("select");
    STATUS_OPTIONS.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.value === lead.status) {
        opt.selected = true;
      }
      select.append(opt);
    });

    select.addEventListener("change", async (event) => {
      const nextStatus = event.target.value;
      const { error } = await client.from("leads").update({ status: nextStatus }).eq("id", lead.id);
      if (error) {
        event.target.value = lead.status;
        return;
      }
      lead.status = nextStatus;
      tr.className = "";
      if (statusClassMap[nextStatus]) {
        tr.classList.add(statusClassMap[nextStatus]);
      }
    });

    statusCell.append(select);

    const actionsCell = tr.querySelector("td:last-child");
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "ghost-btn";
    editBtn.textContent = "Modifica";
    editBtn.addEventListener("click", () => startEdit(lead));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger-btn";
    deleteBtn.textContent = "Elimina";
    deleteBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Eliminare definitivamente il lead \"${lead.nome_struttura}\"?`
      );
      if (!confirmed) return;
      const { error } = await client.from("leads").delete().eq("id", lead.id);
      if (error) {
        window.alert("Eliminazione non riuscita. Riprova.");
        return;
      }
      tr.remove();
      if (!leadTableBody.children.length) {
        tableEmpty.hidden = false;
      }
    });
    actionsCell.append(editBtn, deleteBtn);
    leadTableBody.append(tr);
  });
}

async function loadLeads() {
  let query = client
    .from("leads")
    .select(
      "id, nome_struttura, telefono, occupazione, prezzo_medio, altre_strutture, info, citta, booking_link, caricato_da, status"
    )
    .order("created_at", { ascending: false });

  const filtro = filtroPersona.value;
  if (filtro !== "tutti") {
    query = query.eq("caricato_da", filtro);
  }

  const { data, error } = await query;

  if (error) {
    tableEmpty.hidden = false;
    tableEmpty.textContent = "Errore nel caricamento.";
    return;
  }

  renderTableRows(data || []);
}

client.auth.onAuthStateChange((_event, session) => {
  setView(session);
  if (session) {
    loadLeads();
  }
});

loginForm.addEventListener("submit", handleLogin);
leadForm.addEventListener("submit", handleLeadSubmit);
logoutBtn.addEventListener("click", handleLogout);
refreshBtn.addEventListener("click", loadLeads);
filtroPersona.addEventListener("change", loadLeads);
cancelEditBtn.addEventListener("click", clearLeadForm);

const { data } = await client.auth.getSession();
setView(data.session);
if (data.session) {
  await loadLeads();
}
