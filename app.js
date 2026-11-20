/* =============================================
   DASHBOARD APP  –  Vanilla JS
   Features:
     • Live clock + date
     • Greeting (time-based + custom name)
     • Focus timer (configurable Pomodoro)
     • To-Do list (add / edit / done / delete)
       – Prevents duplicate tasks
       – Sort: default | A–Z | done-last
     • Quick links (add / delete, persisted)
     • Light / Dark theme toggle
   All data stored in localStorage.
   ============================================= */

"use strict";

/* ─── LocalStorage helpers ─────────────────── */
const LS = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

/* ─── Utility ───────────────────────────────── */
function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

/* =============================================
   1. CLOCK + DATE + GREETING
   ============================================= */
const clockEl        = document.getElementById("clock");
const dateEl         = document.getElementById("date");
const greetingFullEl = document.getElementById("greeting-full");
const greetingTopEl  = document.getElementById("greeting-text");
const nameDisplayEl  = document.getElementById("name-display");
const editNameBtn    = document.getElementById("edit-name-btn");
const nameForm       = document.getElementById("name-form");
const nameInput      = document.getElementById("name-input");
const nameSaveBtn    = document.getElementById("name-save-btn");

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function getGreetingWord(hour) {
  if (hour >= 5  && hour < 12) return { word: "Good morning",  emoji: "☀️" };
  if (hour >= 12 && hour < 17) return { word: "Good afternoon", emoji: "🌤" };
  if (hour >= 17 && hour < 21) return { word: "Good evening",   emoji: "🌇" };
  return                               { word: "Good night",     emoji: "🌙" };
}

function updateClock() {
  const now    = new Date();
  const hour   = now.getHours();
  const { word, emoji } = getGreetingWord(hour);
  const name   = LS.get("userName", "");
  const namePart = name ? `, ${name}` : "";

  clockEl.textContent        = `${pad(hour)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  dateEl.textContent         = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  greetingTopEl.textContent  = word;
  greetingFullEl.textContent = `${word}${namePart}! ${emoji}`;
}

setInterval(updateClock, 1000);
updateClock();

/* ── Custom name ───────────────────────────── */
function renderName() {
  const name = LS.get("userName", "");
  nameDisplayEl.textContent = name ? `👤 ${name}` : "";
  editNameBtn.textContent   = name ? "✏️ Edit name" : "✏️ Set name";
}

renderName();

editNameBtn.addEventListener("click", () => {
  nameInput.value = LS.get("userName", "");
  nameForm.classList.toggle("hidden");
  if (!nameForm.classList.contains("hidden")) nameInput.focus();
});

function saveName() {
  const val = nameInput.value.trim();
  LS.set("userName", val);
  renderName();
  updateClock();
  nameForm.classList.add("hidden");
}

nameSaveBtn.addEventListener("click", saveName);
nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") saveName(); });

/* =============================================
   2. LIGHT / DARK THEME
   ============================================= */
const themeToggleBtn = document.getElementById("theme-toggle");
const themeIconEl    = document.getElementById("theme-icon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIconEl.textContent = theme === "dark" ? "☀️" : "🌙";
  LS.set("theme", theme);
}

// Init from storage (default: dark)
applyTheme(LS.get("theme", "dark"));

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* =============================================
   3. FOCUS TIMER  (Pomodoro)
   ============================================= */
const timerTimeEl     = document.getElementById("timer-time");
const timerProgressEl = document.getElementById("timer-progress");
const timerStartBtn   = document.getElementById("timer-start");
const timerStopBtn    = document.getElementById("timer-stop");
const timerResetBtn   = document.getElementById("timer-reset");
const timerStatusEl   = document.getElementById("timer-status");
const timerMinutesIn  = document.getElementById("timer-minutes");
const applyTimeBtn    = document.getElementById("apply-time-btn");

let timerDuration  = LS.get("timerDuration", 25) * 60; // seconds
let timerRemaining = timerDuration;
let timerInterval  = null;
let timerRunning   = false;

// Reflect persisted duration in input
timerMinutesIn.value = timerDuration / 60;

function updateTimerDisplay() {
  timerTimeEl.textContent = formatTime(timerRemaining);

  const pct = timerDuration > 0 ? (timerRemaining / timerDuration) * 100 : 100;
  timerProgressEl.style.width = pct + "%";

  timerProgressEl.classList.remove("low", "critical");
  if (pct <= 20) timerProgressEl.classList.add("critical");
  else if (pct <= 40) timerProgressEl.classList.add("low");
}

function timerTick() {
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning  = false;
    timerRemaining = 0;
    updateTimerDisplay();
    setTimerBtns(false);
    timerStatusEl.textContent = "✅ Session complete! Take a break.";
    // Browser notification (if permitted)
    if (Notification.permission === "granted") {
      new Notification("Focus Timer", { body: "Session complete! Take a break. 🎉" });
    }
    return;
  }
  timerRemaining--;
  updateTimerDisplay();
}

function setTimerBtns(running) {
  timerStartBtn.disabled = running;
  timerStopBtn.disabled  = !running;
}

timerStartBtn.addEventListener("click", () => {
  if (timerRunning) return;
  if (timerRemaining <= 0) timerRemaining = timerDuration; // auto-reset if finished
  timerRunning  = true;
  timerInterval = setInterval(timerTick, 1000);
  setTimerBtns(true);
  timerStatusEl.textContent = "▶ Running…";
  // Request notification permission on first start
  if (Notification.permission === "default") Notification.requestPermission();
});

timerStopBtn.addEventListener("click", () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  setTimerBtns(false);
  timerStatusEl.textContent = "⏸ Paused.";
});

timerResetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval  = null;
  timerRunning   = false;
  timerRemaining = timerDuration;
  updateTimerDisplay();
  setTimerBtns(false);
  timerStatusEl.textContent = "";
});

// Challenge: change Pomodoro time
applyTimeBtn.addEventListener("click", () => {
  const mins = parseInt(timerMinutesIn.value, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) {
    timerStatusEl.textContent = "⚠️ Enter a value between 1 and 120.";
    return;
  }
  // Stop any running timer first
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;

  timerDuration  = mins * 60;
  timerRemaining = timerDuration;
  LS.set("timerDuration", mins);
  updateTimerDisplay();
  setTimerBtns(false);
  timerStatusEl.textContent = `✔ Timer set to ${mins} minute${mins !== 1 ? "s" : ""}.`;
});

updateTimerDisplay();

/* =============================================
   4. TO-DO LIST
   ============================================= */
const todoInput   = document.getElementById("todo-input");
const todoAddBtn  = document.getElementById("todo-add-btn");
const todoListEl  = document.getElementById("todo-list");
const todoEmptyEl = document.getElementById("todo-empty");
const filterBtns  = document.querySelectorAll(".filter-btn");

let tasks      = LS.get("tasks", []);
let sortMode   = LS.get("taskSort", "default");

/* ── Persistence ───────────────────────────── */
function saveTasks() {
  LS.set("tasks", tasks);
}

/* ── Render ────────────────────────────────── */
function getSortedTasks() {
  const copy = [...tasks];
  if (sortMode === "az") {
    copy.sort((a, b) => a.text.localeCompare(b.text));
  } else if (sortMode === "done") {
    copy.sort((a, b) => Number(a.done) - Number(b.done));
  }
  // "default" keeps insertion order
  return copy;
}

function renderTasks() {
  todoListEl.innerHTML = "";
  const sorted = getSortedTasks();

  todoEmptyEl.style.display = sorted.length === 0 ? "block" : "none";

  sorted.forEach((task) => {
    const li = document.createElement("li");
    li.className = `todo-item${task.done ? " done" : ""}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${task.done ? "checked" : ""} title="Mark done" />
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <div class="todo-actions">
        <button class="todo-action-btn edit"   title="Edit">✏️</button>
        <button class="todo-action-btn delete" title="Delete">🗑</button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector(".todo-checkbox").addEventListener("change", () => {
      const t = tasks.find((x) => x.id === task.id);
      if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
    });

    // Edit
    li.querySelector(".edit").addEventListener("click", () => startEdit(li, task));

    // Delete
    li.querySelector(".delete").addEventListener("click", () => {
      tasks = tasks.filter((x) => x.id !== task.id);
      saveTasks();
      renderTasks();
    });

    todoListEl.appendChild(li);
  });
}

function startEdit(li, task) {
  const textSpan   = li.querySelector(".todo-text");
  const actionsDiv = li.querySelector(".todo-actions");

  const editInput = document.createElement("input");
  editInput.type      = "text";
  editInput.value     = task.text;
  editInput.className = "todo-edit-input";
  editInput.maxLength = 100;

  const saveBtn   = document.createElement("button");
  saveBtn.textContent = "💾";
  saveBtn.className   = "todo-action-btn";
  saveBtn.title       = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "✖";
  cancelBtn.className   = "todo-action-btn";
  cancelBtn.title       = "Cancel";

  textSpan.replaceWith(editInput);
  actionsDiv.innerHTML = "";
  actionsDiv.appendChild(saveBtn);
  actionsDiv.appendChild(cancelBtn);

  editInput.focus();

  function commitEdit() {
    const newText = editInput.value.trim();
    if (!newText) { renderTasks(); return; }

    // Duplicate check (excluding the task being edited)
    const isDup = tasks.some(
      (x) => x.id !== task.id && x.text.toLowerCase() === newText.toLowerCase()
    );
    if (isDup) {
      editInput.style.borderColor = "var(--danger)";
      editInput.title = "Duplicate task!";
      editInput.select();
      return;
    }

    const t = tasks.find((x) => x.id === task.id);
    if (t) { t.text = newText; saveTasks(); }
    renderTasks();
  }

  saveBtn.addEventListener("click", commitEdit);
  cancelBtn.addEventListener("click", renderTasks);
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter")  commitEdit();
    if (e.key === "Escape") renderTasks();
  });
}

/* ── Add task ──────────────────────────────── */
function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Challenge: prevent duplicates
  const isDuplicate = tasks.some((t) => t.text.toLowerCase() === text.toLowerCase());
  if (isDuplicate) {
    // Flash the existing item
    const existing = todoListEl.querySelector(
      `[data-id]`
    );
    // Find by text match
    const allItems = todoListEl.querySelectorAll(".todo-item");
    allItems.forEach((el) => {
      const span = el.querySelector(".todo-text");
      if (span && span.textContent.toLowerCase() === text.toLowerCase()) {
        el.classList.remove("flash");
        // Trigger reflow to restart animation
        void el.offsetWidth;
        el.classList.add("flash");
      }
    });
    todoInput.style.borderColor = "var(--danger)";
    setTimeout(() => (todoInput.style.borderColor = ""), 1200);
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  todoInput.value = "";
  todoInput.style.borderColor = "";
  renderTasks();
}

todoAddBtn.addEventListener("click", addTask);
todoInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

/* ── Sort buttons ──────────────────────────── */
filterBtns.forEach((btn) => {
  if (btn.dataset.sort === sortMode) btn.classList.add("active");
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    sortMode = btn.dataset.sort;
    LS.set("taskSort", sortMode);
    renderTasks();
  });
});

renderTasks();

/* =============================================
   5. QUICK LINKS
   ============================================= */
const linkNameInput = document.getElementById("link-name-input");
const linkUrlInput  = document.getElementById("link-url-input");
const linkAddBtn    = document.getElementById("link-add-btn");
const linksGridEl   = document.getElementById("links-grid");
const linksEmptyEl  = document.getElementById("links-empty");

let links = LS.get("quickLinks", []);

function saveLinks() {
  LS.set("quickLinks", links);
}

function faviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return "";
  }
}

function renderLinks() {
  linksGridEl.innerHTML = "";
  linksEmptyEl.style.display = links.length === 0 ? "block" : "none";

  links.forEach((link) => {
    const a = document.createElement("a");
    a.href          = link.url;
    a.target        = "_blank";
    a.rel           = "noopener noreferrer";
    a.className     = "link-item";
    a.dataset.id    = link.id;

    const favicon = faviconUrl(link.url);
    const imgHtml = favicon
      ? `<img src="${favicon}" class="link-favicon" alt="" loading="lazy" onerror="this.style.display='none'" />`
      : "";

    const delBtn = document.createElement("button");
    delBtn.className   = "link-delete-btn";
    delBtn.textContent = "✕";
    delBtn.title       = "Remove link";
    delBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      links = links.filter((x) => x.id !== link.id);
      saveLinks();
      renderLinks();
    });

    a.innerHTML = `${imgHtml}<span>${escapeHtml(link.label)}</span>`;
    a.appendChild(delBtn);
    linksGridEl.appendChild(a);
  });
}

function addLink() {
  const label = linkNameInput.value.trim();
  let   url   = linkUrlInput.value.trim();

  if (!label || !url) return;

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  try {
    new URL(url); // validate
  } catch {
    linkUrlInput.style.borderColor = "var(--danger)";
    setTimeout(() => (linkUrlInput.style.borderColor = ""), 1200);
    return;
  }

  links.push({ id: Date.now(), label, url });
  saveLinks();
  linkNameInput.value = "";
  linkUrlInput.value  = "";
  renderLinks();
}

linkAddBtn.addEventListener("click", addLink);
linkUrlInput.addEventListener("keydown",  (e) => { if (e.key === "Enter") addLink(); });
linkNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addLink(); });

renderLinks();

/* =============================================
   UTILITY  –  HTML escaping
   ============================================= */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
