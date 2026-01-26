import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tfspstvhudgjgwuzioth.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc3BzdHZodWRnamd3dXppb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3Mzg3MzUsImV4cCI6MjA4NDMxNDczNX0.t8lOGqC0R1ZS-SpNehhxsTNUZe1ItkIp1PQCmxPHIMs";

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logoutBtn");
const leadGrid = document.getElementById("leadGrid");
const emptyState = document.getElementById("emptyState");
const searchConfermati = document.getElementById("searchConfermati");
const themeToggle = document.getElementById("themeToggle");

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

function applyTheme(value) {
  const isDark = value === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  if (themeToggle) {
    themeToggle.textContent = isDark ? "Giorno" : "Notte";
  }
}

if (themeToggle) {
  const storedTheme = localStorage.getItem("theme") || "light";
  applyTheme(storedTheme);
  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = `Accesso non riuscito: ${error.message || "riprova più tardi."}`;
    return;
  }
  await loadConfermati();
}

async function handleLogout() {
  await client.auth.signOut();
  leadGrid.innerHTML = "";
  emptyState.hidden = false;
}

function formatMonthSummary(reportMesi, label) {
  const months = MONTHS.filter((month) => reportMesi?.[month]?.inviato).map((month) => {
    const date = reportMesi[month]?.data;
    return date ? `${month} (${formatDateIt(date)})` : month;
  });
  if (!months.length) {
    return `${label}: nessuno.`;
  }
  return `${label}: ${months.join(", ")}.`;
}

function formatDateIt(value) {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function updateLead(id, payload) {
  const { error } = await client.from("leads").update(payload).eq("id", id);
  if (error) {
    window.alert("Salvataggio non riuscito. Riprova.");
  }
}

function createField(label, value, type = "text") {
  const wrapper = document.createElement("label");
  wrapper.innerHTML = `${label}`;
  const input = document.createElement("input");
  input.type = type;
  input.value = value || "";
  wrapper.append(input);
  return { wrapper, input };
}

function createSelect(label, value, options) {
  const wrapper = document.createElement("label");
  wrapper.innerHTML = `${label}`;
  const select = document.createElement("select");
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === value) {
      option.selected = true;
    }
    select.append(option);
  });
  wrapper.append(select);
  return { wrapper, select };
}

function createTextarea(label, value) {
  const wrapper = document.createElement("label");
  wrapper.innerHTML = `${label}`;
  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.value = value || "";
  wrapper.append(textarea);
  return { wrapper, textarea };
}

function renderCard(lead) {
  const card = document.createElement("article");
  card.className = "lead-card";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "lead-toggle";
  toggle.setAttribute("aria-expanded", "false");
  const toggleTitle = document.createElement("div");
  toggleTitle.className = "lead-toggle-title";
  toggleTitle.textContent = lead.nome_struttura;
  const togglePhone = document.createElement("span");
  togglePhone.className = "lead-toggle-phone";
  togglePhone.textContent = lead.telefono || "";
  const badge = document.createElement("span");
  badge.className = "user-label";
  badge.textContent = lead.caricato_da || "Senza nome";
  const caret = document.createElement("span");
  caret.className = "lead-toggle-caret";
  caret.textContent = "▾";
  toggle.append(toggleTitle, togglePhone, badge, caret);

  const details = document.createElement("div");
  details.className = "lead-details";
  details.hidden = true;
  toggle.addEventListener("click", () => {
    const next = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(next));
    details.hidden = !next;
    card.classList.toggle("open", next);
  });

  const form = document.createElement("form");
  form.className = "form-grid";

  const attivazione = createField("Data attivazione servizio", lead.data_attivazione, "date");
  const tariffa = createSelect("Tipo di tariffa", lead.tipo_tariffa, [
    { value: "", label: "Seleziona" },
    { value: "notte", label: "Notte" },
    { value: "parallela", label: "Parallela" },
    { value: "mensile", label: "Mensile" },
  ]);
  const reportStatBox = createTextarea("Report statistiche", lead.report_statistiche);
  const reportIncassiBox = createTextarea("Report incassi", lead.report_incassi);
  const reportStatInviato = createSelect("Report statistiche inviato", lead.report_statistiche_inviato, [
    { value: "", label: "Seleziona" },
    { value: "si", label: "Si" },
    { value: "no", label: "No" },
  ]);
  const reportIncassiInviato = createSelect("Report incassi inviato", lead.report_incassi_inviato, [
    { value: "", label: "Seleziona" },
    { value: "si", label: "Si" },
    { value: "no", label: "No" },
  ]);
  const dataProssimoReportStat = createField(
    "Data invio prossimo report statistiche",
    lead.data_prossimo_report_statistiche,
    "date"
  );
  const dataProssimoReportIncassi = createField(
    "Data invio prossimo report incassi",
    lead.data_prossimo_report_incassi,
    "date"
  );
  const invioContratto = createSelect("Invio copia contratto e questionario", lead.invio_contratto, [
    { value: "", label: "Seleziona" },
    { value: "si", label: "Si" },
    { value: "no", label: "No" },
  ]);
  const ultimaDataContatto = createField(
    "Ultima data contatto con cliente",
    lead.ultima_data_contatto,
    "date"
  );
  const compensiCalcolati = createSelect("Compensi calcolati su", lead.compensi_calcolati, [
    { value: "", label: "Seleziona" },
    { value: "lordo", label: "Lordo" },
    { value: "netto", label: "Netto" },
  ]);
  const infoBox = createTextarea("Info", lead.info_extra);

  const breakLine = document.createElement("div");
  breakLine.className = "form-break";
  const breakLineSecond = document.createElement("div");
  breakLineSecond.className = "form-break";

  [
    attivazione,
    tariffa,
    invioContratto,
    infoBox,
  ].forEach((item) => form.append(item.wrapper));
  form.append(breakLine);
  [
    reportStatBox,
    reportStatInviato,
    dataProssimoReportStat,
  ].forEach((item) => form.append(item.wrapper));
  form.append(breakLineSecond);
  [
    reportIncassiBox,
    reportIncassiInviato,
    dataProssimoReportIncassi,
    ultimaDataContatto,
    compensiCalcolati,
  ].forEach((item) => form.append(item.wrapper));

  const panel = document.createElement("div");
  panel.className = "month-panel";
  panel.hidden = true;
  const panelTitle = document.createElement("p");
  panelTitle.className = "pill-meta";
  const panelInput = document.createElement("input");
  panelInput.type = "date";
  const panelActions = document.createElement("div");
  panelActions.className = "month-panel-actions";
  const panelSave = document.createElement("button");
  panelSave.type = "button";
  panelSave.className = "primary-btn";
  panelSave.textContent = "Salva data";
  const panelClear = document.createElement("button");
  panelClear.type = "button";
  panelClear.className = "ghost-btn";
  panelClear.textContent = "Rimuovi mese";
  const panelClose = document.createElement("button");
  panelClose.type = "button";
  panelClose.className = "ghost-btn";
  panelClose.textContent = "Chiudi";
  panelActions.append(panelSave, panelClear, panelClose);
  panel.append(panelTitle, panelInput, panelActions);

  let activeMonthKey = "";
  let activeFieldKey = "";

  const createMonthSection = (label, fieldKey) => {
    const summary = document.createElement("p");
    summary.className = "pill-meta";
    const reportMesi = lead[fieldKey] || {};
    summary.textContent = formatMonthSummary(reportMesi, label);

    const pillRow = document.createElement("div");
    pillRow.className = "pill-row";

    const applyMonthUpdate = async (month, inviato, data) => {
      reportMesi[month] = { inviato, data };
      summary.textContent = formatMonthSummary(reportMesi, label);
      const pill = pillRow.querySelector(`[data-month="${month}"]`);
      if (pill) {
        pill.classList.toggle("active", inviato);
      }
      await updateLead(lead.id, { [fieldKey]: reportMesi });
    };

    MONTHS.forEach((month) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "month-pill";
      pill.dataset.month = month;
      pill.textContent = month;
      if (reportMesi[month]?.inviato) {
        pill.classList.add("active");
      }

      pill.addEventListener("click", async () => {
        const current = reportMesi[month] || { inviato: false, data: "" };
        activeMonthKey = month;
        activeFieldKey = fieldKey;
        panelTitle.textContent = `Data report per ${month}`;
        panelInput.value = current.data || "";
        panel.hidden = false;
        if (typeof panelInput.showPicker === "function") {
          panelInput.showPicker();
        } else {
          panelInput.focus();
        }
      });

      pillRow.append(pill);
    });

    return { summary, pillRow, applyMonthUpdate };
  };

  const listeners = [
    [attivazione.input, "data_attivazione"],
    [tariffa.select, "tipo_tariffa"],
    [reportStatBox.textarea, "report_statistiche"],
    [reportIncassiBox.textarea, "report_incassi"],
    [reportStatInviato.select, "report_statistiche_inviato"],
    [reportIncassiInviato.select, "report_incassi_inviato"],
    [dataProssimoReportStat.input, "data_prossimo_report_statistiche"],
    [dataProssimoReportIncassi.input, "data_prossimo_report_incassi"],
    [invioContratto.select, "invio_contratto"],
    [ultimaDataContatto.input, "ultima_data_contatto"],
    [compensiCalcolati.select, "compensi_calcolati"],
    [infoBox.textarea, "info_extra"],
  ];

  listeners.forEach(([element, field]) => {
    element.addEventListener("change", async () => {
      const value = element.value;
      await updateLead(lead.id, { [field]: value });
    });
  });

  const mesiStatistiche = createMonthSection("Report statistiche inviato nei mesi", "report_mesi_statistiche");
  const mesiIncassi = createMonthSection("Report incassi inviato nei mesi", "report_mesi_incassi");

  const sectionsByKey = {
    report_mesi_statistiche: mesiStatistiche,
    report_mesi_incassi: mesiIncassi,
  };

  panelSave.addEventListener("click", async () => {
    if (!activeFieldKey || !activeMonthKey) return;
    if (!panelInput.value) {
      window.alert("Seleziona una data.");
      return;
    }
    await sectionsByKey[activeFieldKey].applyMonthUpdate(
      activeMonthKey,
      true,
      panelInput.value
    );
  });

  panelClear.addEventListener("click", async () => {
    if (!activeFieldKey || !activeMonthKey) return;
    await sectionsByKey[activeFieldKey].applyMonthUpdate(activeMonthKey, false, "");
  });

  panelClose.addEventListener("click", () => {
    panel.hidden = true;
  });

  details.append(
    form,
    mesiStatistiche.summary,
    mesiStatistiche.pillRow,
    mesiIncassi.summary,
    mesiIncassi.pillRow,
    panel
  );
  card.append(toggle, details);
  return card;
}

function matchesSearch(lead, queryText) {
  if (!queryText) return true;
  return [
    lead.nome_struttura,
    lead.telefono,
    lead.caricato_da,
    lead.tipo_tariffa,
    lead.report_statistiche,
    lead.report_incassi,
    lead.report_statistiche_inviato,
    lead.report_incassi_inviato,
    lead.data_attivazione,
    lead.data_prossimo_report_statistiche,
    lead.data_prossimo_report_incassi,
    lead.invio_contratto,
    lead.ultima_data_contatto,
    lead.info_extra,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(queryText));
}

async function loadConfermati() {
  const { data, error } = await client
    .from("leads")
    .select(
      "id, nome_struttura, telefono, caricato_da, data_attivazione, tipo_tariffa, report_statistiche, report_incassi, report_statistiche_inviato, report_incassi_inviato, data_prossimo_report_statistiche, data_prossimo_report_incassi, invio_contratto, ultima_data_contatto, compensi_calcolati, info_extra, report_mesi_statistiche, report_mesi_incassi"
    )
    .eq("status", "confermato")
    .order("created_at", { ascending: false });

  if (error) {
    emptyState.hidden = false;
    emptyState.textContent = "Errore nel caricamento.";
    return;
  }

  leadGrid.innerHTML = "";
  const queryText = searchConfermati.value.trim().toLowerCase();
  const filtered = (data || []).filter((lead) => matchesSearch(lead, queryText));
  if (!filtered.length) {
    emptyState.hidden = false;
    emptyState.textContent = queryText
      ? "Nessun risultato trovato."
      : "Nessun lead confermato.";
    return;
  }

  emptyState.hidden = true;
  filtered.forEach((lead) => leadGrid.append(renderCard(lead)));
}

client.auth.onAuthStateChange((_event, session) => {
  setView(session);
  if (session) {
    loadConfermati();
  }
});

loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);
searchConfermati.addEventListener("input", loadConfermati);

const { data } = await client.auth.getSession();
setView(data.session);
if (data.session) {
  await loadConfermati();
}
