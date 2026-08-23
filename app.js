/* ---------- Display names ---------- */
/* Internally, records keep using "Home" / "WR9 0BA" as their route key (so old
   captured data keeps working) — this just controls what's shown on screen. */
const LOCATION_DISPLAY_NAMES = { "Home": "Evesham", "WR9 0BA": "Droitwich" };
function displayLocation(name) {
  return LOCATION_DISPLAY_NAMES[name] || name;
}

// Settings screen card titles — fixed, independent of any stored label,
// so they show the friendly names even for settings saved before this update.
const PLACE_TITLES = { home: "Evesham (Home)", wr9: "Droitwich (WR9 0BA)", safran: "Safran (Hatherley Lane)" };

/* ---------- Settings & storage ---------- */

function defaultSettings() {
  return {
    tomtomKey: "",
    captureWeather: true,
    places: {
      home: { label: "Home", address: "10 Codling Road, Evesham, WR11, UK", useExact: false, lat: 0, lng: 0 },
      wr9: { label: "WR9 0BA", address: "WR9 0BA, UK", useExact: false, lat: 0, lng: 0 },
      safran: { label: "Safran (Hatherley Lane)", address: "Hatherley Lane, Gloucester, UK", useExact: false, lat: 0, lng: 0 }
    }
  };
}

function getSettings() {
  const defaults = defaultSettings();
  try {
    const raw = localStorage.getItem("commuteSettings");
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      tomtomKey: parsed.tomtomKey ?? defaults.tomtomKey,
      captureWeather: parsed.captureWeather ?? defaults.captureWeather,
      places: {
        home: { ...defaults.places.home, ...(parsed.places && parsed.places.home) },
        wr9: { ...defaults.places.wr9, ...(parsed.places && parsed.places.wr9) },
        safran: { ...defaults.places.safran, ...(parsed.places && parsed.places.safran) }
      }
    };
  } catch (e) {
    return defaults;
  }
}

function saveSettings(s) {
  localStorage.setItem("commuteSettings", JSON.stringify(s));
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem("commuteRecords")) || [];
  } catch (e) {
    return [];
  }
}

function addRecord(record) {
  const records = getRecords();
  record.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  records.push(record);
  localStorage.setItem("commuteRecords", JSON.stringify(records));
}

/* ---------- Small helpers ---------- */

function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function ukSeason(d) {
  const m = d.getMonth() + 1;
  if (m === 12 || m === 1 || m === 2) return "Winter";
  if (m >= 3 && m <= 5) return "Spring";
  if (m >= 6 && m <= 8) return "Summer";
  return "Autumn";
}

function currentPeriod() {
  return new Date().getHours() < 12 ? "Morning" : "Evening";
}

/* ---------- Navigation ---------- */

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

/* ---------- Settings screen ---------- */

function placeCardHTML(key, place) {
  return `
    <div class="card">
      <h3>${escapeHtml(PLACE_TITLES[key] || place.label)}</h3>
      <label>Address</label>
      <input type="text" id="place-${key}-address" value="${escapeHtml(place.address)}">
      <div class="toggle-row">
        <span>Use exact coordinates instead</span>
        <label class="switch">
          <input type="checkbox" id="place-${key}-useExact" ${place.useExact ? "checked" : ""} onchange="toggleCoordRows('${key}')">
          <span class="slider"></span>
        </label>
      </div>
      <div id="place-${key}-coords" class="row" style="margin-top:10px; display:${place.useExact ? "flex" : "none"};">
        <div>
          <label>Lat</label>
          <input type="number" step="any" id="place-${key}-lat" value="${place.lat}">
        </div>
        <div>
          <label>Long</label>
          <input type="number" step="any" id="place-${key}-lng" value="${place.lng}">
        </div>
      </div>
      <div id="place-${key}-hint" class="hint" style="display:${place.useExact ? "block" : "none"};">
        Tip: long-press a spot in Apple Maps to drop a pin, then paste its coordinates here.
      </div>
    </div>
  `;
}

function toggleCoordRows(key) {
  const checked = document.getElementById(`place-${key}-useExact`).checked;
  document.getElementById(`place-${key}-coords`).style.display = checked ? "flex" : "none";
  document.getElementById(`place-${key}-hint`).style.display = checked ? "block" : "none";
}

function renderSettings() {
  const s = getSettings();
  document.getElementById("tomtomKey").value = s.tomtomKey;
  document.getElementById("captureWeather").checked = s.captureWeather;
  document.getElementById("places-container").innerHTML =
    placeCardHTML("home", s.places.home) +
    placeCardHTML("wr9", s.places.wr9) +
    placeCardHTML("safran", s.places.safran);
  document.getElementById("settings-saved-msg").textContent = "";
}

function saveSettingsFromForm() {
  const s = getSettings();
  s.tomtomKey = document.getElementById("tomtomKey").value.trim();
  s.captureWeather = document.getElementById("captureWeather").checked;
  ["home", "wr9", "safran"].forEach((key) => {
    s.places[key].address = document.getElementById(`place-${key}-address`).value.trim();
    s.places[key].useExact = document.getElementById(`place-${key}-useExact`).checked;
    s.places[key].lat = parseFloat(document.getElementById(`place-${key}-lat`).value) || 0;
    s.places[key].lng = parseFloat(document.getElementById(`place-${key}-lng`).value) || 0;
  });
  saveSettings(s);
  document.getElementById("settings-saved-msg").textContent = "Saved ✓";
}

function resetSettings() {
  if (!confirm("Reset addresses to the originally provided defaults?")) return;
  const s = getSettings();
  s.places = defaultSettings().places;
  saveSettings(s);
  renderSettings();
}

/* ---------- Calculate screen ---------- */

function renderCalculate() {
  const period = currentPeriod();
  document.getElementById("period-label").textContent = period;
  document.getElementById("period-direction").textContent =
    period === "Morning" ? "Evesham / Droitwich → Safran" : "Safran → Evesham / Droitwich";
  document.getElementById("calc-error").innerHTML = "";
  document.getElementById("calc-results").innerHTML = "";
}

async function geocodePlace(place, key) {
  if (place.useExact) return { lat: place.lat, lon: place.lng };
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(place.address)}.json?key=${encodeURIComponent(key)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not look up "${place.address}" (TomTom error ${res.status}). Check your API key in Settings.`);
  const data = await res.json();
  const first = data.results && data.results[0];
  if (!first) throw new Error(`Could not find a location for "${place.address}". Check the address in Settings.`);
  return { lat: first.position.lat, lon: first.position.lon };
}

async function routeBetween(origin, destination, key) {
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lon}:${destination.lat},${destination.lon}/json?key=${encodeURIComponent(key)}&traffic=true&travelMode=car`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing request failed (TomTom error ${res.status}).`);
  const data = await res.json();
  const route = data.routes && data.routes[0];
  if (!route) throw new Error("No driving route found between those two points.");
  return {
    minutes: route.summary.travelTimeInSeconds / 60,
    miles: route.summary.lengthInMeters / 1609.34
  };
}

function weatherDescription(code) {
  const map = {
    0: "Clear sky", 1: "Partly cloudy", 2: "Partly cloudy", 3: "Partly cloudy",
    45: "Fog", 48: "Fog",
    51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
    56: "Freezing drizzle", 57: "Freezing drizzle",
    61: "Rain", 63: "Rain", 65: "Rain",
    66: "Freezing rain", 67: "Freezing rain",
    71: "Snow", 73: "Snow", 75: "Snow",
    77: "Snow grains",
    80: "Rain showers", 81: "Rain showers", 82: "Rain showers",
    85: "Snow showers", 86: "Snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail"
  };
  return map[code] || "Unknown";
}

async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    return { temp: c.temperature_2m, precip: c.precipitation, desc: weatherDescription(c.weather_code) };
  } catch (e) {
    return null;
  }
}

async function runCalculation() {
  const btn = document.getElementById("calc-btn");
  const errorBox = document.getElementById("calc-error");
  const resultsBox = document.getElementById("calc-results");
  errorBox.innerHTML = "";
  resultsBox.innerHTML = "";

  const settings = getSettings();
  if (!settings.tomtomKey) {
    errorBox.innerHTML = `<div class="error-box">Add your TomTom API key in Settings first.</div>`;
    return;
  }

  btn.disabled = true;
  btn.textContent = "Calculating…";
  const period = currentPeriod();

  try {
    const safranCoord = await geocodePlace(settings.places.safran, settings.tomtomKey);
    const homeCoord = await geocodePlace(settings.places.home, settings.tomtomKey);
    const wr9Coord = await geocodePlace(settings.places.wr9, settings.tomtomKey);

    let legs;
    if (period === "Morning") {
      const homeLeg = await routeBetween(homeCoord, safranCoord, settings.tomtomKey);
      const wr9Leg = await routeBetween(wr9Coord, safranCoord, settings.tomtomKey);
      legs = [
        { routeLabel: "Home", origin: "Home", destination: "Safran (Hatherley Lane)", ...homeLeg },
        { routeLabel: "WR9 0BA", origin: "WR9 0BA", destination: "Safran (Hatherley Lane)", ...wr9Leg }
      ];
    } else {
      const homeLeg = await routeBetween(safranCoord, homeCoord, settings.tomtomKey);
      const wr9Leg = await routeBetween(safranCoord, wr9Coord, settings.tomtomKey);
      legs = [
        { routeLabel: "Home", origin: "Safran (Hatherley Lane)", destination: "Home", ...homeLeg },
        { routeLabel: "WR9 0BA", origin: "Safran (Hatherley Lane)", destination: "WR9 0BA", ...wr9Leg }
      ];
    }

    let weather = null;
    if (settings.captureWeather) {
      weather = await fetchWeather(safranCoord.lat, safranCoord.lon);
    }

    const now = new Date().toISOString();
    legs.forEach((leg) => {
      addRecord({
        timestamp: now,
        period,
        routeLabel: leg.routeLabel,
        origin: leg.origin,
        destination: leg.destination,
        durationMinutes: leg.minutes,
        distanceMiles: leg.miles,
        weatherTempC: weather ? weather.temp : null,
        weatherPrecipitationMM: weather ? weather.precip : null,
        weatherDescription: weather ? weather.desc : null
      });
    });

    resultsBox.innerHTML = legs.map((leg) => `
      <div class="result-item">
        <div class="route">${escapeHtml(displayLocation(leg.origin))} → ${escapeHtml(displayLocation(leg.destination))}</div>
        <div class="meta">${leg.minutes.toFixed(0)} min · ${leg.miles.toFixed(1)} mi</div>
      </div>
    `).join("");
  } catch (err) {
    errorBox.innerHTML = `<div class="error-box">${escapeHtml(err.message || "Something went wrong.")}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Calculate Now";
  }
}

/* ---------- Data screen: state ---------- */

let currentTopMode = "insights";
let currentChartMode = "overTime";
let currentTrendGrouping = "weekday";
let chartInstance = null;

function setTopMode(mode) {
  currentTopMode = mode;
  document.querySelectorAll("#topmode-segment button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.getElementById("insights-view").style.display = mode === "insights" ? "block" : "none";
  document.getElementById("table-view").style.display = mode === "table" ? "block" : "none";
  document.getElementById("sheet-view").style.display = mode === "sheet" ? "block" : "none";
  if (mode === "insights") renderChart();
}

function setChartMode(mode) {
  currentChartMode = mode;
  document.querySelectorAll("#chart-segment button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.getElementById("trend-grouping-segment").style.display = mode === "trends" ? "flex" : "none";
  renderChart();
}

function setTrendGrouping(mode) {
  currentTrendGrouping = mode;
  document.querySelectorAll("#trend-grouping-segment button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  renderChart();
}

function renderData() {
  const records = getRecords().slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const empty = document.getElementById("data-empty");
  const content = document.getElementById("data-content");

  if (records.length === 0) {
    empty.style.display = "block";
    content.style.display = "none";
    return;
  }

  empty.style.display = "none";
  content.style.display = "block";

  renderOverview(records);
  renderTable(records);
  renderSheet(records);
  if (currentTopMode === "insights") renderChart();
}

/* ---------- Overview ---------- */

function renderOverview(records) {
  const avgAll = records.reduce((sum, r) => sum + r.durationMinutes, 0) / records.length;

  const byRoute = {};
  records.forEach((r) => {
    if (!byRoute[r.routeLabel]) byRoute[r.routeLabel] = [];
    byRoute[r.routeLabel].push(r);
  });
  const routeAverages = Object.keys(byRoute).sort().map((route) => {
    const list = byRoute[route];
    return {
      route,
      avgMin: list.reduce((s, r) => s + r.durationMinutes, 0) / list.length,
      avgMiles: list.reduce((s, r) => s + r.distanceMiles, 0) / list.length
    };
  });

  const fastest = records.reduce((a, b) => (a.durationMinutes < b.durationMinutes ? a : b));
  const slowest = records.reduce((a, b) => (a.durationMinutes > b.durationMinutes ? a : b));

  let diffText = "–", diffDetail = "";
  const home = routeAverages.find((r) => r.route === "Home");
  const wr9 = routeAverages.find((r) => r.route === "WR9 0BA");
  if (home && wr9) {
    const diff = Math.abs(home.avgMin - wr9.avgMin);
    diffText = `${diff.toFixed(0)} min`;
    diffDetail = diff < 0.5 ? "Evenly matched" : (home.avgMin < wr9.avgMin ? "Evesham is faster on average" : "Droitwich is faster on average");
  }

  document.getElementById("stat-grid").innerHTML = `
    <div class="stat-card">
      <div class="label">Average commute</div>
      <div class="value">${avgAll.toFixed(0)} min</div>
    </div>
    <div class="stat-card">
      <div class="label">Evesham vs Droitwich</div>
      <div class="value">${diffText}</div>
      <div class="detail">${diffDetail}</div>
    </div>
    <div class="stat-card">
      <div class="label">Fastest journey</div>
      <div class="value">${fastest.durationMinutes.toFixed(0)} min</div>
      <div class="detail">${escapeHtml(displayLocation(fastest.routeLabel))} · ${formatDateShort(fastest.timestamp)}</div>
    </div>
    <div class="stat-card">
      <div class="label">Slowest journey</div>
      <div class="value">${slowest.durationMinutes.toFixed(0)} min</div>
      <div class="detail">${escapeHtml(displayLocation(slowest.routeLabel))} · ${formatDateShort(slowest.timestamp)}</div>
    </div>
  `;

  const routeAvgCard = document.getElementById("route-avg-card");
  if (routeAverages.length) {
    routeAvgCard.style.display = "block";
    document.getElementById("route-avg-list").innerHTML = routeAverages.map((r) => `
      <div class="route-avg-row">
        <span class="r-name">${escapeHtml(displayLocation(r.route))}</span>
        <span class="r-val">${r.avgMin.toFixed(0)} min · ${r.avgMiles.toFixed(1)} mi</span>
      </div>
    `).join("");
  } else {
    routeAvgCard.style.display = "none";
  }
}

/* ---------- Charts ---------- */

const ROUTE_COLORS = { "Home": "#2dd4bf", "WR9 0BA": "#f59e0b" };
function colorForRoute(route, idx) {
  return ROUTE_COLORS[route] || ["#60a5fa", "#f472b6", "#a78bfa"][idx % 3];
}

function renderChart() {
  const canvas = document.getElementById("dataChart");
  if (!canvas) return;
  const records = getRecords();

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  if (!records.length) return;

  const ctx = canvas.getContext("2d");
  const axisColor = "#93a2bb";
  const gridColor = "#223049";
  const commonOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: "#eef2f8" } } }
  };

  if (currentChartMode === "overTime") {
    const sorted = records.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const uniqueTimestamps = [...new Set(sorted.map((r) => r.timestamp))].sort((a, b) => new Date(a) - new Date(b));
    const labels = uniqueTimestamps.map((t) => formatDateShort(t));
    const routes = [...new Set(sorted.map((r) => r.routeLabel))];
    const datasets = routes.map((route, i) => ({
      label: displayLocation(route),
      data: uniqueTimestamps.map((t) => {
        const rec = sorted.find((r) => r.timestamp === t && r.routeLabel === route);
        return rec ? rec.durationMinutes : null;
      }),
      borderColor: colorForRoute(route, i),
      backgroundColor: colorForRoute(route, i),
      spanGaps: true,
      tension: 0.25,
      pointRadius: 3
    }));
    chartInstance = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        ...commonOptions,
        scales: {
          x: { ticks: { color: axisColor, maxRotation: 60, minRotation: 60 }, grid: { color: gridColor } },
          y: { title: { display: true, text: "Minutes", color: axisColor }, ticks: { color: axisColor }, grid: { color: gridColor } }
        }
      }
    });
  } else if (currentChartMode === "timeOfDay") {
    const routes = [...new Set(records.map((r) => r.routeLabel))];
    const datasets = routes.map((route, i) => ({
      label: displayLocation(route),
      data: records.filter((r) => r.routeLabel === route).map((r) => {
        const d = new Date(r.timestamp);
        return { x: d.getHours() + d.getMinutes() / 60, y: r.durationMinutes };
      }),
      borderColor: colorForRoute(route, i),
      backgroundColor: colorForRoute(route, i),
      pointRadius: 4
    }));
    chartInstance = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: {
        ...commonOptions,
        scales: {
          x: {
            min: 0, max: 24,
            ticks: { color: axisColor, stepSize: 6, callback: (v) => String(v).padStart(2, "0") + ":00" },
            grid: { color: gridColor },
            title: { display: true, text: "Time of day", color: axisColor }
          },
          y: { title: { display: true, text: "Minutes", color: axisColor }, ticks: { color: axisColor }, grid: { color: gridColor } }
        }
      }
    });
  } else if (currentChartMode === "trends") {
    let keyFn, order;
    if (currentTrendGrouping === "weekday") {
      keyFn = (d) => d.toLocaleDateString(undefined, { weekday: "long" });
      order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    } else if (currentTrendGrouping === "month") {
      keyFn = (d) => d.toLocaleDateString(undefined, { month: "long" });
      order = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    } else {
      keyFn = (d) => ukSeason(d);
      order = ["Winter", "Spring", "Summer", "Autumn"];
    }
    const routes = [...new Set(records.map((r) => r.routeLabel))].sort();

    // Only show groups that actually have data (e.g. no Saturday entries yet).
    const labels = order.filter((label) =>
      records.some((r) => keyFn(new Date(r.timestamp)) === label)
    );

    const datasets = routes.map((route, i) => ({
      label: displayLocation(route),
      data: labels.map((label) => {
        const matches = records.filter((r) => r.routeLabel === route && keyFn(new Date(r.timestamp)) === label);
        if (!matches.length) return null;
        return matches.reduce((s, r) => s + r.durationMinutes, 0) / matches.length;
      }),
      backgroundColor: colorForRoute(route, i)
    }));

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        ...commonOptions,
        scales: {
          x: { ticks: { color: axisColor }, grid: { color: gridColor } },
          y: { title: { display: true, text: "Average minutes", color: axisColor }, ticks: { color: axisColor }, grid: { color: gridColor } }
        }
      }
    });
  } else if (currentChartMode === "compare") {
    const periods = ["Morning", "Evening"];
    const routes = [...new Set(records.map((r) => r.routeLabel))].sort();
    const datasets = routes.map((route, i) => ({
      label: displayLocation(route),
      data: periods.map((period) => {
        const subset = records.filter((r) => r.routeLabel === route && r.period === period);
        if (!subset.length) return 0;
        return subset.reduce((s, r) => s + r.durationMinutes, 0) / subset.length;
      }),
      backgroundColor: colorForRoute(route, i)
    }));
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels: periods, datasets },
      options: {
        ...commonOptions,
        scales: {
          x: { ticks: { color: axisColor }, grid: { color: gridColor } },
          y: { title: { display: true, text: "Average minutes", color: axisColor }, ticks: { color: axisColor }, grid: { color: gridColor } }
        }
      }
    });
  }
}

/* ---------- Table ---------- */

function renderTable(records) {
  const container = document.getElementById("table-list");
  container.innerHTML = records.map((r) => {
    const d = new Date(r.timestamp);
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    const dateStr = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const season = ukSeason(d);
    const weatherBits = [];
    if (r.weatherTempC !== null && r.weatherTempC !== undefined) weatherBits.push(`${Math.round(r.weatherTempC)}°C`);
    if (r.weatherDescription) weatherBits.push(r.weatherDescription);
    return `
      <div class="record">
        <div class="record-top">
          <div class="record-top-left">
            <span class="route">${escapeHtml(displayLocation(r.routeLabel))}</span>
            <span class="badge ${r.period === "Evening" ? "evening" : ""}">${escapeHtml(r.period)}</span>
          </div>
          <button class="delete-btn" onclick="deleteRecord('${r.id}')" aria-label="Delete this entry">✕</button>
        </div>
        <div class="path">${escapeHtml(displayLocation(r.origin))} → ${escapeHtml(displayLocation(r.destination))}</div>
        <div class="figures">
          <span>${weekday}, ${dateStr} · ${timeStr}</span>
          <span><strong>${r.durationMinutes.toFixed(0)} min</strong> · ${r.distanceMiles.toFixed(1)} mi</span>
        </div>
        <div class="extra">${season}${weatherBits.length ? " · " + weatherBits.join(" · ") : ""}</div>
      </div>
    `;
  }).join("");
}

/* ---------- Spreadsheet-style view ---------- */

function renderSheet(records) {
  const container = document.getElementById("sheet-container");
  if (!container) return;

  const rows = records.map((r) => {
    const d = new Date(r.timestamp);
    return `
      <tr>
        <td>${d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
        <td>${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
        <td>${d.toLocaleDateString(undefined, { weekday: "short" })}</td>
        <td>${escapeHtml(r.period)}</td>
        <td>${escapeHtml(displayLocation(r.routeLabel))}</td>
        <td>${escapeHtml(displayLocation(r.origin))}</td>
        <td>${escapeHtml(displayLocation(r.destination))}</td>
        <td class="num">${r.durationMinutes.toFixed(0)}</td>
        <td class="num">${r.distanceMiles.toFixed(1)}</td>
        <td class="num">${r.weatherTempC !== null && r.weatherTempC !== undefined ? Math.round(r.weatherTempC) : ""}</td>
        <td>${r.weatherDescription ? escapeHtml(r.weatherDescription) : ""}</td>
        <td>${ukSeason(d)}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="sheet-scroll">
      <table class="sheet-table">
        <thead>
          <tr>
            <th>Date</th><th>Time</th><th>Day</th><th>Period</th><th>Route</th>
            <th>From</th><th>To</th><th>Min</th><th>Mi</th><th>°C</th><th>Weather</th><th>Season</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ---------- Delete / reset ---------- */

function deleteRecord(id) {
  if (!confirm("Delete this entry? This can't be undone.")) return;
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem("commuteRecords", JSON.stringify(records));
  renderData();
}

function resetAllData() {
  if (!confirm("Delete ALL captured commute data? This can't be undone — export a CSV first if you want a backup.")) return;
  localStorage.removeItem("commuteRecords");
  renderData();
}

/* ---------- CSV export (your only backup — data lives in this browser only) ---------- */

function exportCSV() {
  const records = getRecords().slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (!records.length) return;
  const headers = ["timestamp", "period", "routeLabel", "origin", "destination", "durationMinutes", "distanceMiles", "weatherTempC", "weatherPrecipitationMM", "weatherDescription"];
  const rows = records.map((r) => headers.map((h) => {
    let v = r[h];
    if (v === null || v === undefined) v = "";
    if (typeof v === "string" && v.includes(",")) v = `"${v}"`;
    return v;
  }).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commute-data-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- Service worker ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
