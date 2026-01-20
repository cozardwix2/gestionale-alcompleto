import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tfspstvhudgjgwuzioth.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc3BzdHZodWRnamd3dXppb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3Mzg3MzUsImV4cCI6MjA4NDMxNDczNX0.t8lOGqC0R1ZS-SpNehhxsTNUZe1ItkIp1PQCmxPHIMs";

const PEOPLE = ["Alessio", "Davide", "Lorenzo"];

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let refreshTimer = null;

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logoutBtn");

const addReminderBtn = document.getElementById("addReminderBtn");
const modal = document.getElementById("modal");
const reminderForm = document.getElementById("reminderForm");
const reminderId = document.getElementById("reminderId");
const reminderText = document.getElementById("reminderText");
const reminderDate = document.getElementById("reminderDate");
const reminderTime = document.getElementById("reminderTime");
const reminderOwner = document.getElementById("reminderOwner");
const reminderStatus = document.getElementById("reminderStatus");
const saveReminderBtn = document.getElementById("saveReminderBtn");
const cancelReminderBtn = document.getElementById("cancelReminderBtn");
const deleteReminderBtn = document.getElementById("deleteReminderBtn");
const reminderError = document.getElementById("reminderError");

const columns = {
  Alessio: document.getElementById("colAlessio"),
  Davide: document.getElementById("colDavide"),
  Lorenzo: document.getElementById("colLorenzo"),
};

function prettyName(email) {
  if (!email) return "";
  const base = email.split("@")[0] || email;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function setView(session) {
  if (session) {
    loginView.hidden = true;
    appView.hidden = false;
    userLabel.textContent = prettyName(session.user.email);
  } else {
    loginView.hidden = false;
    appView.hidden = true;
    userLabel.textContent = "Non autenticato";
  }
}

function openModal(reminder = null) {
  reminderError.textContent = "";
  if (reminder) {
    reminderId.value = reminder.id;
    reminderText.value = reminder.testo;
    reminderDate.value = reminder.data_scadenza;
    reminderTime.value = reminder.ora_scadenza || "";
    reminderOwner.value = reminder.assegnato_a;
    reminderStatus.value = reminder.stato;
    saveReminderBtn.textContent = "Salva modifiche";
    deleteReminderBtn.hidden = false;
  } else {
    reminderForm.reset();
    reminderId.value = "";
    saveReminderBtn.textContent = "Salva";
    deleteReminderBtn.hidden = true;
  }
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  reminderForm.reset();
  reminderId.value = "";
}

function getDueDate(reminder) {
  const date = reminder.data_scadenza;
  if (!date) return null;
  if (reminder.ora_scadenza) {
    return new Date(`${date}T${reminder.ora_scadenza}`);
  }
  return new Date(`${date}T00:00:00`);
}

function getReminderClass(reminder) {
  if (reminder.stato === "completato") return "reminder-done";
  const due = getDueDate(reminder);
  if (!due) return "reminder-far";
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs < 0) return "reminder-overdue";
  const diffDays = diffMs / 86400000;
  if (diffDays <= 1) return "reminder-urgent";
  if (diffDays <= 3) return "reminder-soon";
  return "reminder-far";
}

function formatDateIt(value) {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(value) {
  if (!value) return "";
  const parts = value.split(":");
  if (parts.length < 2) return value;
  return `${parts[0]}:${parts[1]}`;
}

function renderReminder(reminder) {
  const card = document.createElement("div");
  card.className = `reminder-card ${getReminderClass(reminder)}`;

  const title = document.createElement("h3");
  title.textContent = reminder.testo;

  const meta = document.createElement("div");
  meta.className = "reminder-meta";
  const timeLabel = reminder.ora_scadenza ? ` ${formatTime(reminder.ora_scadenza)}` : "";
  meta.textContent = `Scadenza: ${formatDateIt(reminder.data_scadenza)}${timeLabel} · Stato: ${
    reminder.stato === "completato" ? "Completato" : "Da fare"
  }`;

  const actions = document.createElement("div");
  actions.className = "reminder-actions";
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "ghost-btn";
  editBtn.textContent = "Modifica";
  editBtn.addEventListener("click", () => openModal(reminder));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "danger-btn";
  deleteBtn.textContent = "Elimina";
  deleteBtn.addEventListener("click", async () => {
    const confirmed = window.confirm("Eliminare questo reminder?");
    if (!confirmed) return;
    const { error } = await client.from("reminders").delete().eq("id", reminder.id);
    if (error) {
      window.alert("Eliminazione non riuscita.");
      return;
    }
    await loadReminders();
  });

  actions.append(editBtn, deleteBtn);
  card.append(title, meta, actions);
  return card;
}

async function loadReminders() {
  const { data, error } = await client
    .from("reminders")
    .select("id, testo, data_scadenza, ora_scadenza, stato, assegnato_a")
    .order("data_scadenza", { ascending: true });

  if (error) {
    return;
  }

  PEOPLE.forEach((person) => {
    columns[person].innerHTML = "";
  });

  const sorted = (data || []).slice().sort((a, b) => {
    const dueA = getDueDate(a);
    const dueB = getDueDate(b);
    if (!dueA && !dueB) return 0;
    if (!dueA) return 1;
    if (!dueB) return -1;
    return dueA.getTime() - dueB.getTime();
  });

  sorted.forEach((reminder) => {
    const column = columns[reminder.assegnato_a];
    if (column) {
      column.append(renderReminder(reminder));
    }
  });
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
  await loadReminders();
}

async function handleLogout() {
  await client.auth.signOut();
  PEOPLE.forEach((person) => {
    columns[person].innerHTML = "";
  });
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

async function handleReminderSubmit(event) {
  event.preventDefault();
  reminderError.textContent = "";

  const payload = {
    testo: reminderText.value.trim(),
    data_scadenza: reminderDate.value,
    ora_scadenza: reminderTime.value || null,
    stato: reminderStatus.value,
    assegnato_a: reminderOwner.value,
  };

  if (!payload.testo || !payload.data_scadenza) {
    reminderError.textContent = "Compila tutti i campi.";
    return;
  }

  let error;
  if (reminderId.value) {
    ({ error } = await client.from("reminders").update(payload).eq("id", reminderId.value));
  } else {
    ({ error } = await client.from("reminders").insert(payload));
  }

  if (error) {
    reminderError.textContent = "Salvataggio non riuscito.";
    return;
  }

  closeModal();
  await loadReminders();
}

addReminderBtn.addEventListener("click", () => openModal());
cancelReminderBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
reminderForm.addEventListener("submit", handleReminderSubmit);
deleteReminderBtn.addEventListener("click", async () => {
  if (!reminderId.value) return;
  const confirmed = window.confirm("Eliminare questo reminder?");
  if (!confirmed) return;
  const { error } = await client.from("reminders").delete().eq("id", reminderId.value);
  if (error) {
    reminderError.textContent = "Eliminazione non riuscita.";
    return;
  }
  closeModal();
  await loadReminders();
});

client.auth.onAuthStateChange((_event, session) => {
  setView(session);
  if (session) {
    loadReminders();
    if (!refreshTimer) {
      refreshTimer = setInterval(loadReminders, 300000);
    }
  } else if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});

loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

const { data } = await client.auth.getSession();
setView(data.session);
if (data.session) {
  await loadReminders();
  if (!refreshTimer) {
    refreshTimer = setInterval(loadReminders, 300000);
  }
}
