// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateProfile } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const editNameBtn = document.getElementById("editNameBtn");

editNameBtn?.addEventListener("click", async () => {
  const newName = prompt("Enter your name:");
  if (!newName || !newName.trim()) return;

  try {
    await updateProfile(auth.currentUser, {
      displayName: newName.trim()
    });

    document.getElementById("profileName").textContent = newName.trim();
    dropdown.classList.remove("open");
  } catch {
    alert("Failed to update name");
  }
});

// ================= FIREBASE INIT =================
const firebaseConfig = {
  apiKey: "AIzaSyCuk1-E7-RfE7coqA9hh4rAFpTNIlyTbV8",
  authDomain: "activity-tracker-web-dc8bb.firebaseapp.com",
  projectId: "activity-tracker-web-dc8bb",
  storageBucket: "activity-tracker-web-dc8bb.firebasestorage.app",
  messagingSenderId: "243753651024",
  appId: "1:243753651024:web:3030467037a6c830b63a55"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= AUTH STATE =================
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const nameEl = document.getElementById("profileName");
  const avatarEl = document.getElementById("profileAvatar");

  if (nameEl) {
    nameEl.textContent =
      user.displayName || user.email.split("@")[0];
  }

  if (avatarEl) {
    avatarEl.src =
      user.photoURL ||
      "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(nameEl.textContent);
  }

  loadHabits();
});

const profileBtn = document.getElementById("profileBtn");
const dropdown = document.getElementById("profileDropdown");

profileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", () => {
  if (dropdown) dropdown.style.display = "none";
});
profileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
  dropdown?.classList.remove("open");
});

// ================= LOGOUT =================
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch {
    alert("Failed to log out. Please try again.");
  }
});

// ================= CREATE HABIT =================
async function createHabit(title) {
  if (!currentUser) return;

  await addDoc(collection(db, "habits"), {
    userId: currentUser.uid,
    title,
    frequency: "daily",
    createdAt: serverTimestamp(),
    logs: {}
  });
}
// ================= MAP FIRESTORE HABITS → UI =================
function syncFirestoreHabitsToUI(firestoreHabits) {
  const habitMeta = loadHabitMeta(MONTH);

  habitMeta.order = habitMeta.order || [];
  habitMeta.names = habitMeta.names || {};
  habitMeta.custom = habitMeta.custom || {};
  habitMeta.deleted = habitMeta.deleted || {};

  firestoreHabits.forEach(habit => {
    const id = `fs-${habit.id}`; // virtual stable ID

    if (!habitMeta.order.includes(id)) {
      habitMeta.order.push(id);
    }

    habitMeta.names[id] = habit.title;
    habitMeta.custom[id] = true;
    habitMeta.deleted[id] = false;
  });

  saveHabitMeta(MONTH, habitMeta);
}

// ================= LOAD HABITS FROM FIRESTORE =================
async function loadHabits() {
  if (!currentUser) return;

  const q = query(
    collection(db, "habits"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(q);

  const firestoreHabits = [];

  snapshot.forEach((doc) => {
    firestoreHabits.push({
      id: doc.id,
      ...doc.data()
    });
  });

  syncFirestoreHabitsToUI(firestoreHabits);

  loadSheet(); // re-render using updated meta
}


const API_URL =
  "https://script.google.com/macros/s/AKfycbwN0UH1eIGNFy2yfxjj5dZT8l9sLVG_XrIYfxyy9lhloFZOOcFCpZo-iFF1ojl_Olru/exec";

let MONTH = "JANUARY";
let chartInstance = null;

let cachedData = null;
let cachedHeaderIndex = null;
let cachedDayCols = null;
let cachedCountCol = null;

/* ================================
   INIT
================================ */
loadSheet();

/* ================================
   LOAD SHEET
================================ */
function loadSheet() {
  fetch(`${API_URL}?month=${MONTH}`)
    .then(res => res.json())
    .then(data => renderMonth(data))
    .catch(err => {
      console.error("LOAD ERROR:", err);
      document.getElementById("table-container").innerText =
        "Failed to load data";
    });
}

/* ================================
   LOCAL STORAGE (CACHED)
================================ */
let localStorageCache = {};

function loadLocalCache(month) {
  const key = `habit-${month}`;
  localStorageCache = JSON.parse(localStorage.getItem(key) || "{}");
}

function saveLocal(month, row, col, value) {
  const key = `habit-${month}`;
  localStorageCache[`${row}-${col}`] = value;
  localStorage.setItem(key, JSON.stringify(localStorageCache));
}

function getLocal(month, row, col) {
  return localStorageCache[`${row}-${col}`];
}
function getHabitName(month, rowIndex, originalName) {
  return localStorage.getItem(`habit-name-${month}-${rowIndex}`) || originalName;
}

function saveHabitName(month, rowIndex, newName) {
  localStorage.setItem(`habit-name-${month}-${rowIndex}`, newName);
}
function getHabitMetaKey(month) {
  return `habit-meta-${month}`;
}

function loadHabitMeta(month) {
  return JSON.parse(localStorage.getItem(getHabitMetaKey(month)) || "{}");
}

function saveHabitMeta(month, meta) {
  localStorage.setItem(getHabitMetaKey(month), JSON.stringify(meta));
}

/* ================================
   DATE HELPERS
================================ */
function getToday() {
  return new Date();
}

function isCurrentMonth(month) {
  return (
    month ===
    new Date().toLocaleString("default", { month: "long" }).toUpperCase()
  );
}

/* ================================
   RENDER MONTH
================================ */
function renderMonth(data) {
  const container = document.getElementById("table-container");
  container.innerHTML = "";

  const table = document.createElement("table");

  const monthIndex = data.findIndex(r => r && r[0] === MONTH);
  if (monthIndex === -1) return;

  const headerIndex = data.findIndex(
    (r, i) => i > monthIndex && r && r[0] === "HABIT"
  );
  if (headerIndex === -1) return;

  cachedData = data;
  cachedHeaderIndex = headerIndex;

  const header = data[headerIndex];
  const dayCols = [];

  let countCol = -1;

  header.forEach((cell, i) => {
    if (Number.isInteger(cell)) dayCols.push(i);
    if (cell === "COUNT") countCol = i;
  });

  cachedDayCols = dayCols;
  cachedCountCol = countCol;

  loadLocalCache(MONTH);
let habitMeta = loadHabitMeta(MONTH);

if (!habitMeta.order) {
  habitMeta.order = [];
  habitMeta.names = {};
  habitMeta.deleted = {};
  habitMeta.custom = {};

  for (let r = cachedHeaderIndex + 1; r < cachedData.length; r++) {
    if (!cachedData[r] || !cachedData[r][0]) break;
    habitMeta.order.push(r);
  }

  saveHabitMeta(MONTH, habitMeta);
}


  /* HEADER */
  const trHead = document.createElement("tr");
  header.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    trHead.appendChild(th);
  });
  table.appendChild(trHead);

  /* ROWS */
for (const r of habitMeta.order) {
  if (habitMeta.deleted?.[r]) continue;

  let row;

if (habitMeta.custom?.[r]) {
  row = [];

  // habit name
  row[0] = habitMeta.names[r];

  // day checkboxes (default false)
  cachedDayCols.forEach(c => {
    row[c] = getLocal(MONTH, r, c) ?? false;
  });

  // count column
  row[cachedCountCol] = 0;
} else {
  row = data[r];
}


  if (!row || !row[0]) continue;


  const tr = document.createElement("tr");
tr.dataset.habitId = r;   // ✅ MUST BE HERE

/* ================================
   DRAG & DROP (REORDER HABITS)
================================ */
tr.draggable = true;

/* Drag start */
tr.ondragstart = e => {
  e.dataTransfer.setData("text/plain", r);
  tr.style.opacity = "0.5";
};

/* Allow drop */
tr.ondragover = e => e.preventDefault();

/* Drop */
tr.ondrop = e => {
  e.preventDefault();

  const from = Number(e.dataTransfer.getData("text/plain"));
  const to = r;

  if (from === to) return;

  const order = habitMeta.order;
  order.splice(order.indexOf(from), 1);
  order.splice(order.indexOf(to), 0, from);

  habitMeta.order = order;
  saveHabitMeta(MONTH, habitMeta);

  loadSheet(); // re-render table + graph
};

/* Drag end */
tr.ondragend = () => {
  tr.style.opacity = "1";
};


    row.forEach((cell, c) => {
      const td = document.createElement("td");

if (c === 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "habit-cell";

  const nameSpan = document.createElement("span");
  nameSpan.className = "habit-name";
  nameSpan.textContent = getHabitName(MONTH, r, cell);

  /* EDIT */
  const editBtn = document.createElement("span");
  editBtn.className = "habit-btn edit-btn";
  editBtn.textContent = "Edit";

  editBtn.onclick = () => {
    const newName = prompt("Edit habit name:", nameSpan.textContent);
    if (!newName || !newName.trim()) return;

    saveHabitName(MONTH, r, newName.trim());
    nameSpan.textContent = newName.trim();
    updateChartLabels();
  };

  /* DELETE */
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "habit-btn delete-btn";
  deleteBtn.textContent = "Delete";

deleteBtn.onclick = async () => {
  if (!confirm(`Delete "${nameSpan.textContent}"?`)) return;

  // Firestore-backed habit
  if (String(r).startsWith("fs-")) {
    const firestoreId = String(r).replace("fs-", "");
    await deleteHabitFirestore(firestoreId);
  }

  // Remove from local meta so UI updates immediately
  const habitMeta = loadHabitMeta(MONTH);
  habitMeta.deleted = habitMeta.deleted || {};
  habitMeta.deleted[r] = true;

  saveHabitMeta(MONTH, habitMeta);
  loadHabits(); // re-sync from Firestore
};

  wrapper.appendChild(nameSpan);
  wrapper.appendChild(editBtn);
  wrapper.appendChild(deleteBtn);
  td.appendChild(wrapper);
}

      else if (dayCols.includes(c)) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = getLocal(MONTH, r, c) ?? (cell === true);

        checkbox.onchange = () => {
          saveLocal(MONTH, r, c, checkbox.checked);
          if (!habitMeta.custom?.[r]) {
  updateCell(r + 1, c + 1, checkbox.checked);
}

          updateRowStats(tr, r);

          updateChartData();
        };

        td.appendChild(checkbox);
      }

      else if (c === countCol) {
  td.className = "count-cell";
  td.dataset.countCell = "true";
  td.textContent = "0";
}


      tr.appendChild(td);
    });

    table.appendChild(tr);
    updateRowStats(tr, r);
  }

  container.appendChild(table);
  renderLineChart(data, headerIndex, dayCols);
}

/* ================================
   UPDATE ROW COUNT & STREAK
================================ */
function updateRowStats(tr) {
  const habitId = Number(tr.dataset.habitId);
  let count = 0;

  cachedDayCols.forEach(c => {
    if (getLocal(MONTH, habitId, c) === true) {
      count++;
    }
  });

  const countCell = tr.querySelector('[data-count-cell="true"]');
  if (countCell) {
    countCell.textContent = count;
  }
}


/* ================================
   LINE CHART – MULTI HABIT (FIXED)
================================ */
function renderLineChart(data, headerIndex, dayCols) {
  const canvas = document.getElementById("progressChart");
  if (!canvas) return;

  const labels = dayCols.map((_, i) => i + 1);
  const datasets = [];

  // Extended color palette (no habit left out)
  const colors = [
    "#5dffb1", "#54a0ff", "#feca57", "#ff9f43",
    "#ff6b6b", "#48dbfb", "#1dd1a1", "#c8d6e5",
    "#a29bfe", "#fd79a8", "#00cec9", "#fab1a0"
  ];

  let idx = 0;

  const habitMeta = loadHabitMeta(MONTH);

for (const r of habitMeta.order) {
  if (habitMeta.deleted?.[r]) continue;

  const row = data[r];
  if (!row || !row[0]) continue;


    const habitName = habitMeta.custom?.[r]
  ? habitMeta.names[r]
  : getHabitName(MONTH, r, row[0]);

    if (!habitName) continue;

    const values = dayCols.map(c =>
      (getLocal(MONTH, r, c) ?? row[c]) === true ? 100 : 0
    );

    datasets.push({
  habitId: r,              // 🔑 PERMANENT KEY
  label: habitName,
  data: values,
  borderColor: colors[idx % colors.length],
  backgroundColor: "transparent",
  borderWidth: 2,
  tension: 0.35,
  pointRadius: 0
});


    idx++;
  }

if (chartInstance) chartInstance.destroy();

chartInstance = new Chart(canvas, {
  type: "line",
  data: { labels, datasets },
  options: {
  responsive: true,
  maintainAspectRatio: false,

  layout: {
    padding: {
      left: 0,
      right: Math.floor(canvas.width * 0.10)
    }
  },

  plugins: {
    legend: {
      position: "right",
      align: "start",
      labels: {
        color: "#eafff4",
        boxWidth: 22,
        padding: 12,
        font: {
          size: 12,
          weight: "500"
        }
      }
    }
  },

  scales: {
    x: {
      ticks: {
        color: "#c9fbe3",
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
        padding: 6,
        align: "center"
      },
      grid: { display: false }
    },
    y: {
  min: 0,
  max: 100,
  ticks: {
    color: "#c9fbe3",
    callback: v => v + "%",
    padding: 0,
    
  },
}

  },

  animation: false
}

});

  canvas.closest(".chart-section").style.display = "block";
  document.getElementById("chart-loading").style.display = "none";
}

/* ================================
   UPDATE SHEET
================================ */
function updateCell(row, col, value) {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month: MONTH, row, col, value })
  });
}

/* ================================
   CHANGE MONTH
================================ */
function changeMonth(m) {
  MONTH = m;
  localStorageCache = {};
  loadSheet();
}
/* ================================
   UPDATE CHART DATA (SAFE & FAST)
================================ */
function updateChartData() {
  if (!chartInstance) return;

  chartInstance.data.datasets.forEach(ds => {
    const habitId = ds.habitId;

    cachedDayCols.forEach((c, i) => {
      ds.data[i] = getLocal(MONTH, habitId, c) === true ? 100 : 0;
    });
  });

  chartInstance.update("none");
}
function updateChartLabels() {
  if (!chartInstance) return;

  const habitMeta = loadHabitMeta(MONTH);

  chartInstance.data.datasets.forEach(ds => {
    const r = ds.habitId;

    ds.label = habitMeta.custom?.[r]
      ? habitMeta.names[r]
      : getHabitName(MONTH, r, cachedData[r][0]);
  });

  chartInstance.update("none");
}

/* ================================
   ADD NEW HABIT
================================ */
function getDayColsFromHeader(data) {
  const headerRow = data[cachedHeaderIndex];
  const cols = [];

  headerRow.forEach((cell, i) => {
    if (Number.isInteger(cell)) cols.push(i);
  });

  return cols;
}

document.getElementById("add-habit-btn")?.addEventListener("click", async () => {
  const name = prompt("Enter new habit name:");
  if (!name || !name.trim()) return;

  await createHabit(name.trim());
  // Firestore → loadHabits() → syncFirestoreHabitsToUI → loadSheet()
});
// ================= DELETE HABIT (FIRESTORE) =================
async function deleteHabitFirestore(firestoreId) {
  if (!currentUser) return;

  const { deleteDoc, doc } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  await deleteDoc(doc(db, "habits", firestoreId));
}
