const PARTS = [
  { key: "shoulder", label: "肩" },
  { key: "chest", label: "胸" },
  { key: "back", label: "背" },
  { key: "core", label: "核心" },
  { key: "arms", label: "手臂" },
  { key: "legs", label: "腿" }
];

const STRENGTH_OPTIONS = {
  shoulder: [
    ["machine_shoulder_press", "器械上推", 120, 12, 4],
    ["dumbbell_shoulder_press", "哑铃推肩", 20, 12, 3],
    ["dumbbell_fly_shoulder", "哑铃飞鸟", 20, 12, 3]
  ],
  chest: [
    ["machine_chest_press", "器械推胸", 140, 12, 4],
    ["incline_dumbbell_press", "哑铃30度卧推", 25, 12, 4],
    ["dumbbell_chest_fly", "哑铃夹胸", 20, 12, 3],
    ["cable_upper_fly", "龙门架上夹胸", 50, 12, 3],
    ["cable_lower_fly", "龙门架下夹胸", 50, 12, 3]
  ],
  back: [
    ["machine_rear_pull", "器械后拉", 100, 12, 4],
    ["machine_lat_pull", "器械下拉", 85, 12, 3],
    ["dumbbell_row", "哑铃划船", 40, 12, 4],
    ["cable_face_pull", "龙门架面拉", 55, 12, 3]
  ],
  core: [
    ["barbell_deadlift_100", "杠铃硬拉", 100, 10, 4],
    ["barbell_deadlift_90", "杠铃硬拉", 90, 12, 4],
    ["dumbbell_deadlift", "哑铃硬拉", 60, 12, 4]
  ],
  arms: [
    ["dumbbell_biceps_curl", "二头哑铃弯举", 15, 12, 2],
    ["two_hand_triceps_dumbbell", "三头双手哑铃", 35, 12, 4],
    ["cable_biceps", "龙门架二头", 80, 12, 3],
    ["cable_triceps", "龙门架三头", 90, 12, 3]
  ],
  legs: [["dumbbell_squat", "哑铃深蹲", 70, 12, 3]]
};

const CARDIO_OPTIONS = [
  { key: "incline_walk", label: "爬坡", bodyPart: "legs", incline: 9, speed: 2.2, duration: 13 },
  { key: "run", label: "跑步", bodyPart: "legs", speed: 5, duration: 20 }
];

const STORE_KEY = "fitness-volume-records-v1";
const CONFIRMED_KEY = "fitness-volume-confirmed-dates-v1";
const app = document.querySelector("#app");
const state = {
  page: "today",
  date: today(),
  autoDateSync: true,
  part: "chest",
  period: "week",
  detail: null,
  records: loadRecords(),
  confirmedDates: {}
};

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadConfirmedDates(records) {
  try {
    const saved = localStorage.getItem(CONFIRMED_KEY);
    if (saved) return JSON.parse(saved) || {};
  } catch {
    return {};
  }

  return records.reduce((dates, record) => {
    dates[record.date] = true;
    return dates;
  }, {});
}

function saveRecords() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state.records));
  localStorage.setItem(CONFIRMED_KEY, JSON.stringify(state.confirmedDates));
}

function partLabel(key) {
  return PARTS.find((part) => part.key === key)?.label || key;
}

function optionLabel(type, key, partKey) {
  if (type === "strength") {
    return (STRENGTH_OPTIONS[partKey] || []).find((item) => item[0] === key)?.[1] || key;
  }
  return CARDIO_OPTIONS.find((item) => item.key === key)?.label || key;
}

function strengthOptions(partKey) {
  return (STRENGTH_OPTIONS[partKey] || []).map(([key, label]) => ({ key, label }));
}

function getStrengthOption(partKey, exerciseKey) {
  return (STRENGTH_OPTIONS[partKey] || []).find((item) => item[0] === exerciseKey);
}

function getCardioOption(exerciseKey) {
  return CARDIO_OPTIONS.find((item) => item.key === exerciseKey);
}

function calculateVolume(record) {
  if (record.type === "strength") {
    return num(record.weight) * num(record.reps) * num(record.sets);
  }
  if (record.exerciseKey === "incline_walk") {
    return num(record.incline) * num(record.speed) * num(record.duration);
  }
  return num(record.speed) * num(record.duration);
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value) {
  const rounded = Math.round(num(value) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function recordsForDate(date) {
  return state.records.filter((record) => record.date === date);
}

function isEditableDate() {
  return state.date === today();
}

function isConfirmed(date) {
  return Boolean(state.confirmedDates[date]);
}

function markDateUnconfirmed(date) {
  state.confirmedDates[date] = false;
}

function confirmToday() {
  if (!isEditableDate()) return;
  state.confirmedDates[state.date] = true;
  state.detail = null;
  persistRender();
}

function confirmedRecords() {
  return state.records.filter((record) => isConfirmed(record.date));
}

function dailyBestForExercise(type, exerciseKey) {
  const matching = confirmedRecords().filter((record) => record.type === type && record.exerciseKey === exerciseKey);
  const days = new Map();

  matching.forEach((record) => {
    const current = days.get(record.date) || { date: record.date, volume: 0, records: [] };
    current.volume += calculateVolume(record);
    current.records.push(record);
    days.set(record.date, current);
  });

  const bestDay = Array.from(days.values()).sort((a, b) => b.volume - a.volume)[0];
  if (!bestDay) return null;
  const bestRecord = bestDay.records.slice().sort((a, b) => calculateVolume(b) - calculateVolume(a))[0];
  return { ...bestDay, record: bestRecord };
}

function strengthDefaults(partKey, exerciseKey) {
  const option = getStrengthOption(partKey, exerciseKey);
  const best = dailyBestForExercise("strength", exerciseKey);
  return {
    exerciseKey,
    exerciseName: option?.[1] || best?.record.exerciseName || "",
    weight: best?.record.weight ?? option?.[2] ?? 0,
    reps: best?.record.reps ?? option?.[3] ?? 0,
    sets: best?.record.sets ?? option?.[4] ?? 0
  };
}

function cardioDefaults(exerciseKey) {
  const option = getCardioOption(exerciseKey);
  const best = dailyBestForExercise("cardio", exerciseKey);
  return {
    exerciseKey,
    exerciseName: option?.label || best?.record.exerciseName || "",
    incline: best?.record.incline ?? option?.incline ?? "",
    speed: best?.record.speed ?? option?.speed ?? 0,
    duration: best?.record.duration ?? option?.duration ?? 0
  };
}

function addStrengthRecord() {
  if (!isEditableDate()) return;
  const part = "chest";
  const defaults = strengthDefaults(part, STRENGTH_OPTIONS[part][0][0]);
  state.records.push({
    id: uid(),
    date: state.date,
    type: "strength",
    bodyPart: part,
    exerciseKey: defaults.exerciseKey,
    exerciseName: defaults.exerciseName,
    weight: defaults.weight,
    reps: defaults.reps,
    sets: defaults.sets
  });
  markDateUnconfirmed(state.date);
  persistRender();
}

function addCardioRecord() {
  if (!isEditableDate()) return;
  const option = CARDIO_OPTIONS[0];
  const defaults = cardioDefaults(option.key);
  state.records.push({
    id: uid(),
    date: state.date,
    type: "cardio",
    bodyPart: option.bodyPart,
    exerciseKey: defaults.exerciseKey,
    exerciseName: defaults.exerciseName,
    incline: defaults.incline,
    speed: defaults.speed,
    duration: defaults.duration
  });
  markDateUnconfirmed(state.date);
  persistRender();
}

function removeRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !isEditableDate()) return;
  state.records = state.records.filter((record) => record.id !== id);
  markDateUnconfirmed(state.date);
  persistRender();
}

function updateRecord(id, patch) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !isEditableDate()) return;

  Object.assign(record, patch);
  if (patch.bodyPart && record.type === "strength") {
    const firstExercise = STRENGTH_OPTIONS[patch.bodyPart][0][0];
    Object.assign(record, strengthDefaults(patch.bodyPart, firstExercise));
  }
  if (patch.exerciseKey && record.type === "strength") {
    Object.assign(record, strengthDefaults(record.bodyPart, patch.exerciseKey));
  }
  if (patch.exerciseKey && record.type === "cardio") {
    Object.assign(record, cardioDefaults(patch.exerciseKey));
  }
  markDateUnconfirmed(record.date);
  persistRender();
}

function persistRender() {
  saveRecords();
  render();
}

function syncDateToToday(force = false) {
  const current = today();
  if (!force && !state.autoDateSync) return;
  state.autoDateSync = true;
  if (state.date !== current) {
    state.date = current;
    state.detail = null;
    render();
  }
}

function render() {
  app.innerHTML = state.page === "today" ? todayPage() : state.page === "trends" ? trendPage() : bestsPage();
  bindEvents();
  if (state.page === "trends") renderCharts();
}

function todayPage() {
  const dateRecords = recordsForDate(state.date);
  const strength = dateRecords.filter((record) => record.type === "strength");
  const cardio = dateRecords.filter((record) => record.type === "cardio");
  const strengthTotal = total(strength);
  const cardioTotal = total(cardio);
  const editable = isEditableDate();
  const confirmed = isConfirmed(state.date);

  return `
    <header class="topbar">
      <div>
        <h1>今日训练</h1>
      </div>
      <div class="date-control">
        <input type="date" id="datePicker" value="${state.date}" />
        <span class="badge ${editable ? "" : "readonly"}">${editable ? "今日可编辑" : "往期只读"}</span>
      </div>
    </header>

    <section class="sync-card card">
      <div>
        <strong>${confirmed ? "今日已确认" : editable ? "今日待确认" : "往期记录"}</strong>
        <span>${state.autoDateSync ? "日期已自动同步系统日历" : "正在查看手动选择日期"}</span>
      </div>
      <div class="sync-actions">
        ${state.autoDateSync ? "" : `<button class="ghost-button" data-action="sync-today">回到今天</button>`}
        ${editable ? `<button class="confirm-button" data-action="confirm-today" ${confirmed ? "disabled" : ""}>确认今日训练</button>` : ""}
      </div>
    </section>

    <section class="summary-grid">
      ${metric("无氧容量", fmt(strengthTotal))}
      ${metric("有氧容量", fmt(cardioTotal))}
      ${metric("胸", fmt(partTotal(dateRecords, "chest")))}
      ${metric("肩", fmt(partTotal(dateRecords, "shoulder")))}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>无氧训练</h2>
        <span class="section-total">${fmt(strengthTotal)}</span>
      </div>
      <div class="entry-list">
        ${strength.length ? strength.map(strengthRow).join("") : empty("暂无无氧训练")}
        ${editable ? `<button class="add-button" data-action="add-strength">新增无氧</button>` : ""}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>有氧训练</h2>
        <span class="section-total">${fmt(cardioTotal)}</span>
      </div>
      <div class="entry-list">
        ${cardio.length ? cardio.map(cardioRow).join("") : empty("暂无有氧训练")}
        ${editable ? `<button class="add-button" data-action="add-cardio">新增有氧</button>` : ""}
      </div>
    </section>

    ${tabs()}
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function empty(text) {
  return `<div class="card empty">${text}</div>`;
}

function total(records) {
  return records.reduce((sum, record) => sum + calculateVolume(record), 0);
}

function partTotal(records, partKey) {
  return total(records.filter((record) => record.bodyPart === partKey));
}

function strengthRow(record) {
  const editable = isEditableDate();
  const options = strengthOptions(record.bodyPart);
  return `
    <article class="card entry-card">
      <div class="entry-grid">
        ${selectField("部位", "bodyPart", record.id, PARTS, record.bodyPart, editable)}
        ${selectField("动作", "exerciseKey", record.id, options, record.exerciseKey, editable)}
      </div>
      <div class="numbers">
        ${inputField("重量", "weight", record.id, record.weight, editable)}
        ${inputField("次数", "reps", record.id, record.reps, editable)}
        ${inputField("组数", "sets", record.id, record.sets, editable)}
      </div>
      <div class="entry-foot">
        <span class="volume-pill">容量 ${fmt(calculateVolume(record))}</span>
        ${editable ? `<button class="delete-button" data-action="delete" data-id="${record.id}">删除</button>` : ""}
      </div>
    </article>
  `;
}

function cardioRow(record) {
  const editable = isEditableDate();
  const isIncline = record.exerciseKey === "incline_walk";
  return `
    <article class="card entry-card">
      <div class="entry-grid">
        ${selectField("部位", "bodyPart", record.id, PARTS, record.bodyPart, editable)}
        ${selectField("动作", "exerciseKey", record.id, CARDIO_OPTIONS.map((item) => ({ key: item.key, label: item.label })), record.exerciseKey, editable)}
      </div>
      <div class="numbers cardio">
        ${isIncline ? inputField("坡度", "incline", record.id, record.incline, editable) : ""}
        ${inputField("速度", "speed", record.id, record.speed, editable)}
        ${inputField("时长", "duration", record.id, record.duration, editable)}
      </div>
      <div class="entry-foot">
        <span class="volume-pill orange">容量 ${fmt(calculateVolume(record))}</span>
        ${editable ? `<button class="delete-button" data-action="delete" data-id="${record.id}">删除</button>` : ""}
      </div>
    </article>
  `;
}

function selectField(label, field, id, options, value, editable) {
  return `
    <div class="field">
      <label>${label}</label>
      <select data-field="${field}" data-id="${id}" ${editable ? "" : "disabled"}>
        ${options.map((item) => `<option value="${item.key}" ${item.key === value ? "selected" : ""}>${item.label}</option>`).join("")}
      </select>
    </div>
  `;
}

function inputField(label, field, id, value, editable) {
  return `
    <div class="field">
      <label>${label}</label>
      <input inputmode="decimal" type="number" step="0.1" data-field="${field}" data-id="${id}" value="${value ?? ""}" ${editable ? "" : "readonly"} />
    </div>
  `;
}

function trendPage() {
  const detail = state.detail ? detailPanel(state.detail) : "";
  return `
    <header class="topbar">
      <h1>趋势</h1>
      <span class="badge">本地数据</span>
    </header>

    <section class="filters">
      <div class="filter-row">
        <span>部位</span>
        <div class="segmented">
          ${PARTS.map((part) => `<button data-filter="part" data-value="${part.key}" class="${state.part === part.key ? "active" : ""}">${part.label}</button>`).join("")}
        </div>
      </div>
      <div class="filter-row">
        <span>时间</span>
        <div class="segmented time">
          ${[
            ["day", "日"],
            ["week", "周"],
            ["month", "月"]
          ].map(([key, label]) => `<button data-filter="period" data-value="${key}" class="${state.period === key ? "active" : ""}">${label}</button>`).join("")}
        </div>
      </div>
    </section>

    ${chartCard("strength", "无氧训练容量趋势", "当前部位的无氧容量变化", "green")}
    ${chartCard("cardio", "有氧训练容量趋势", "当前部位的有氧容量变化", "orange")}
    ${detail}
    ${tabs()}
  `;
}

function chartCard(type, title, subtitle, color) {
  return `
    <section class="card chart-card">
      <div class="chart-head">
        <div>
          <h2>${title}</h2>
          <p class="chart-subtitle">${partLabel(state.part)} · ${periodLabel(state.period)}</p>
        </div>
      </div>
      <div class="chart-wrap">
        <canvas data-chart="${type}" data-color="${color}"></canvas>
      </div>
    </section>
  `;
}

function detailPanel(detail) {
  return `
    <section class="card detail-panel">
      <h2>${detail.title}</h2>
      <div class="detail-list">
        ${detail.items.length ? detail.items.map(detailRow).join("") : `<div class="empty">暂无动作数据</div>`}
      </div>
    </section>
  `;
}

function detailRow(item) {
  return `
    <div class="detail-row">
      <strong>${item.name}</strong>
      <span>${item.meta}</span>
    </div>
  `;
}

function bestsPage() {
  const strengthItems = allStrengthExercises().map((item) => bestCard("strength", item));
  const cardioItems = CARDIO_OPTIONS.map((item) =>
    bestCard("cardio", {
      bodyPart: item.bodyPart,
      exerciseKey: item.key,
      exerciseName: item.label
    })
  );

  return `
    <header class="topbar">
      <h1>最高记录</h1>
      <span class="badge">确认后更新</span>
    </header>

    <section class="section">
      <div class="section-head">
        <h2>无氧训练</h2>
        <span class="section-total">${strengthItems.length} 个动作</span>
      </div>
      <div class="record-list">${strengthItems.join("")}</div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>有氧训练</h2>
        <span class="section-total">${cardioItems.length} 个动作</span>
      </div>
      <div class="record-list">${cardioItems.join("")}</div>
    </section>

    ${tabs()}
  `;
}

function allStrengthExercises() {
  return Object.entries(STRENGTH_OPTIONS).flatMap(([bodyPart, options]) =>
    options.map(([exerciseKey, exerciseName]) => ({ bodyPart, exerciseKey, exerciseName }))
  );
}

function bestCard(type, item) {
  const best = dailyBestForExercise(type, item.exerciseKey);
  const emptyMeta = type === "strength" ? "暂无已确认记录" : "暂无已确认记录";
  const detail = best ? bestRecordMeta(type, best.record) : emptyMeta;
  return `
    <article class="card best-card">
      <div>
        <strong>${item.exerciseName}</strong>
        <span>${partLabel(item.bodyPart)} · ${type === "strength" ? "无氧" : "有氧"}</span>
      </div>
      <div class="best-value">
        <strong>${best ? fmt(best.volume) : "--"}</strong>
        <span>${best ? `${best.date} · ${detail}` : detail}</span>
      </div>
    </article>
  `;
}

function bestRecordMeta(type, record) {
  if (type === "strength") {
    return `${record.weight} × ${record.reps} × ${record.sets}`;
  }
  if (record.exerciseKey === "incline_walk") {
    return `坡度 ${record.incline} · 速度 ${record.speed} · ${record.duration} mins`;
  }
  return `速度 ${record.speed} · ${record.duration} mins`;
}

function tabs() {
  return `
    <nav class="tabs">
      <button data-page="today" class="${state.page === "today" ? "active" : ""}">今日</button>
      <button data-page="bests" class="${state.page === "bests" ? "active" : ""}">最高</button>
      <button data-page="trends" class="${state.page === "trends" ? "active" : ""}">趋势</button>
    </nav>
  `;
}

function periodLabel(period) {
  return { day: "日", week: "周", month: "月" }[period];
}

function bindEvents() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.page;
      state.detail = null;
      render();
    });
  });

  const datePicker = document.querySelector("#datePicker");
  if (datePicker) {
    datePicker.addEventListener("change", (event) => {
      state.date = event.target.value || today();
      state.autoDateSync = state.date === today();
      render();
    });
  }

  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.dataset.action;
      if (action === "add-strength") addStrengthRecord();
      if (action === "add-cardio") addCardioRecord();
      if (action === "delete") removeRecord(el.dataset.id);
      if (action === "confirm-today") confirmToday();
      if (action === "sync-today") syncDateToToday(true);
    });
  });

  document.querySelectorAll("input[data-field]").forEach((input) => {
    input.addEventListener("change", () => updateRecord(input.dataset.id, { [input.dataset.field]: input.value }));
  });

  document.querySelectorAll("select[data-field]").forEach((select) => {
    select.addEventListener("change", () => updateRecord(select.dataset.id, { [select.dataset.field]: select.value }));
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state[button.dataset.filter] = button.dataset.value;
      state.detail = null;
      render();
    });
  });
}

function renderCharts() {
  document.querySelectorAll("canvas[data-chart]").forEach((canvas) => {
    const type = canvas.dataset.chart;
    const series = buildSeries(type);
    drawChart(canvas, series, canvas.dataset.color);
  });
}

function buildSeries(type) {
  const filtered = confirmedRecords().filter((record) => record.type === type && record.bodyPart === state.part);
  const buckets = new Map();
  filtered.forEach((record) => {
    const key = bucketKey(record.date, state.period);
    buckets.set(key, (buckets.get(key) || 0) + calculateVolume(record));
  });
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, label: key, value }));
}

function drawChart(canvas, series, colorName) {
  const wrap = canvas.parentElement;
  wrap.querySelector(".chart-empty")?.remove();
  const rect = wrap.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const width = rect.width;
  const height = rect.height;
  const pad = { top: 18, right: 16, bottom: 32, left: 42 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const color = colorName === "orange" ? "#f47b45" : "#1f8f5f";

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#dce6e1";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#6b7772";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";

  for (let i = 0; i <= 3; i += 1) {
    const y = pad.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
  }

  if (!series.length) {
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = `暂无该部位的${canvas.dataset.chart === "cardio" ? "有氧" : "无氧"}数据`;
    wrap.appendChild(empty);
    canvas.onclick = null;
    return;
  }

  const max = Math.max(...series.map((point) => point.value), 1);
  const points = series.map((point, index) => {
    const x = pad.left + (series.length === 1 ? chartW / 2 : (chartW / (series.length - 1)) * index);
    const y = pad.top + chartH - (point.value / max) * chartH;
    return { ...point, x, y };
  });

  ctx.fillStyle = "#6b7772";
  [0, max / 2, max].forEach((value, index) => {
    const y = pad.top + chartH - (value / max) * chartH;
    ctx.fillText(fmt(value), 4, y + 4);
    if (index < points.length) {
      const labelPoint = points[index === 2 ? points.length - 1 : index];
      ctx.fillText(shortLabel(labelPoint.label), labelPoint.x - 18, height - 10);
    }
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  canvas.onclick = (event) => {
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const nearest = points.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best), points[0]);
    state.detail = buildDetail(canvas.dataset.chart, nearest.key);
    render();
  };
}

function shortLabel(label) {
  if (state.period === "day") return label.slice(5);
  if (state.period === "month") return label.slice(2);
  return label.replace(/^(\d{4})-W/, "W");
}

function bucketKey(dateString, period) {
  if (period === "day") return dateString;
  const date = new Date(`${dateString}T00:00:00`);
  if (period === "month") return dateString.slice(0, 7);
  const week = isoWeek(date);
  return `${week.year}-W${String(week.week).padStart(2, "0")}`;
}

function isoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return { year: target.getUTCFullYear(), week };
}

function buildDetail(type, key) {
  const records = confirmedRecords().filter((record) => record.type === type && record.bodyPart === state.part && bucketKey(record.date, state.period) === key);
  const title = `${key} ${state.period === "day" ? "动作明细" : "动作累计"}`;
  if (state.period === "day") {
    return {
      title,
      items: records.map((record) => ({
        name: record.exerciseName,
        meta:
          record.type === "strength"
            ? `${record.weight} × ${record.reps} × ${record.sets}，容量 ${fmt(calculateVolume(record))}`
            : cardioMeta(record)
      }))
    };
  }

  const map = new Map();
  records.forEach((record) => {
    const current = map.get(record.exerciseKey) || {
      name: record.exerciseName,
      volume: 0,
      sets: 0,
      reps: 0,
      duration: 0,
      dates: new Set()
    };
    current.volume += calculateVolume(record);
    current.sets += num(record.sets);
    current.reps += num(record.reps) * num(record.sets || 1);
    current.duration += num(record.duration);
    current.dates.add(record.date);
    map.set(record.exerciseKey, current);
  });

  return {
    title,
    items: Array.from(map.values()).map((item) => ({
      name: item.name,
      meta: `训练容量总计 ${fmt(item.volume)}`
    }))
  };
}

function cardioMeta(record) {
  if (record.exerciseKey === "incline_walk") {
    return `坡度 ${record.incline}，速度 ${record.speed}，时长 ${record.duration} mins，容量 ${fmt(calculateVolume(record))}`;
  }
  return `速度 ${record.speed}，时长 ${record.duration} mins，容量 ${fmt(calculateVolume(record))}`;
}

function seedIfEmpty() {
  if (state.records.length) return;
  const date = today();
  [
    ["chest", "machine_chest_press"],
    ["chest", "incline_dumbbell_press"],
    ["chest", "dumbbell_chest_fly"],
    ["shoulder", "machine_shoulder_press"]
  ].forEach(([part, exerciseKey]) => {
    const item = STRENGTH_OPTIONS[part].find((option) => option[0] === exerciseKey);
    state.records.push({
      id: uid(),
      date,
      type: "strength",
      bodyPart: part,
      exerciseKey: item[0],
      exerciseName: item[1],
      weight: item[2],
      reps: item[3],
      sets: item[4]
    });
  });
  CARDIO_OPTIONS.forEach((option) => {
    state.records.push({
      id: uid(),
      date,
      type: "cardio",
      bodyPart: option.bodyPart,
      exerciseKey: option.key,
      exerciseName: option.label,
      incline: option.incline || "",
      speed: option.speed,
      duration: option.duration
    });
  });
  state.confirmedDates[date] = true;
  saveRecords();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

state.confirmedDates = loadConfirmedDates(state.records);
seedIfEmpty();
render();

setInterval(() => syncDateToToday(false), 60000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncDateToToday(false);
});
