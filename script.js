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

  deleteBtn.onclick = () => {
    if (!confirm(`Delete "${nameSpan.textContent}"?`)) return;

    const habitMeta = loadHabitMeta(MONTH);
    habitMeta.deleted = habitMeta.deleted || {};
    habitMeta.deleted[r] = true;

    saveHabitMeta(MONTH, habitMeta);
    loadSheet(); // refresh table + graph
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

document.getElementById("add-habit-btn")?.addEventListener("click", () => {
  const name = prompt("Enter new habit name:");
  if (!name || !name.trim()) return;

  const habitMeta = loadHabitMeta(MONTH);

  // create a unique virtual habit id (never clashes with sheet rows)
  const id = -Date.now();

  // store habit name
  habitMeta.names = habitMeta.names || {};
  habitMeta.names[id] = name.trim();

  // mark as custom habit
  habitMeta.custom = habitMeta.custom || {};
  habitMeta.custom[id] = true;

  // add to order
  habitMeta.order.push(id);

  saveHabitMeta(MONTH, habitMeta);
  loadSheet(); // re-render table + graph
});
