const FALLBACK_DATA = {
  profile: {
    city: "Shanghai",
    timezone: "Asia/Shanghai"
  },
  integrations: {
    publicIcalUrl: "",
    weatherProvider: {
      enabled: false,
      type: "open-meteo",
      latitude: 31.2304,
      longitude: 121.4737
    }
  },
  weather: {
    condition: "Updating",
    temperature: "--",
    high: "--",
    low: "--",
    feelsLike: "--",
    humidity: "--",
    aqi: "--",
    sunrise: "--:--",
    sunset: "--:--",
    wind: "--",
    forecast: []
  },
  calendar: [
    {
      title: "English Reading",
      date: "2026-06-29",
      time: "20:00",
      type: "study"
    },
    {
      title: "Football Training",
      date: "2026-06-30",
      time: "18:30",
      type: "sport"
    },
    {
      title: "Family Dinner",
      date: "2026-07-03",
      time: "19:00",
      type: "family"
    }
  ],
  holidays: [
    {
      date: "2026-06-19",
      label: "Juneteenth"
    },
    {
      date: "2026-07-04",
      label: "Independence Day"
    },
    {
      date: "2026-10-01",
      label: "National Day"
    },
    {
      date: "2026-10-06",
      label: "Mid-Autumn"
    }
  ],
  countdowns: [
    {
      title: "距离高考",
      targetDate: "2031-06-07",
      subtitle: "Keep going, one day at a time."
    },
    {
      title: "距离生日",
      targetDate: "2026-09-01",
      subtitle: "A quiet celebration is coming."
    },
    {
      title: "Next Family Trip",
      targetDate: "2026-10-01",
      subtitle: "The next journey begins."
    },
    {
      title: "Lisbon Dinner Show",
      targetDate: "2026-10-20",
      subtitle: "Set Sail for the Next Horizon."
    }
  ],
  dailyCard: {
    label: "Word of the Day",
    word: "vanish",
    meaning: "to disappear suddenly",
    example: "The sound vanished into the night."
  }
};

const STORAGE_KEY = "home-screen-edits-v1";

const state = {
  data: cloneData(FALLBACK_DATA),
  pageIndex: 0,
  selectedScheduleDay: null,
  touchStartX: 0,
  touchStartY: 0
};

const elements = {
  currentTime: document.querySelector("#currentTime"),
  timePeriod: document.querySelector("#timePeriod"),
  currentDate: document.querySelector("#currentDate"),
  cityLine: document.querySelector("#cityLine"),
  heroCity: document.querySelector("#heroCity"),
  heroCondition: document.querySelector("#heroCondition"),
  weatherSummary: document.querySelector("#weatherSummary"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  humidity: document.querySelector("#humidity"),
  aqi: document.querySelector("#aqi"),
  feelsLike: document.querySelector("#feelsLike"),
  wind: document.querySelector("#wind"),
  forecastList: document.querySelector("#forecastList"),
  todayNumber: document.querySelector("#todayNumber"),
  monthLabel: document.querySelector("#monthLabel"),
  monthCalendar: document.querySelector("#monthCalendar"),
  calendarList: document.querySelector("#calendarList"),
  countdownList: document.querySelector("#countdownList"),
  dailyLabel: document.querySelector("#dailyLabel"),
  dailyWord: document.querySelector("#dailyWord"),
  dailyMeaning: document.querySelector("#dailyMeaning"),
  dailyExample: document.querySelector("#dailyExample"),
  editModal: document.querySelector("#editModal"),
  editForm: document.querySelector("#editForm"),
  editTitle: document.querySelector("#editTitle"),
  editFields: document.querySelector("#editFields"),
  editClose: document.querySelector("#editClose"),
  editCancel: document.querySelector("#editCancel"),
  editDelete: document.querySelector("#editDelete"),
  pageTrack: document.querySelector("#pageTrack"),
  pageDots: document.querySelector("#pageDots"),
  scheduleDate: document.querySelector("#scheduleDate"),
  scheduleDayName: document.querySelector("#scheduleDayName"),
  scheduleTabs: document.querySelector("#scheduleTabs"),
  scheduleList: document.querySelector("#scheduleList")
};

init();

async function init() {
  tickClock();
  setInterval(tickClock, 1000);

  state.data = await loadData();
  wireEditors();
  wirePageSwipe();
  await refreshLiveWeather();
  renderAll();
  window.addEventListener("resize", debounce(renderAll, 160));

  // A light refresh keeps long-running screen mode current without rebuilding the page.
  setInterval(renderAll, 30000);
  setInterval(refreshLiveWeather, 30 * 60 * 1000);
}

async function loadData() {
  let data = cloneData(FALLBACK_DATA);

  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`data.json returned ${response.status}`);
    }
    data = await response.json();
  } catch (error) {
    console.warn("Using fallback dashboard data:", error);
  }

  return applySavedEdits(data);
}

function tickClock() {
  const now = new Date();
  const timezone = state.data?.profile?.timezone;
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone
  });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone
  });

  const timeParts = timeFormatter.formatToParts(now);
  const hour = timeParts.find((part) => part.type === "hour")?.value || "--";
  const minute = timeParts.find((part) => part.type === "minute")?.value || "--";
  const dayPeriod = timeParts.find((part) => part.type === "dayPeriod")?.value || "";

  elements.currentTime.textContent = `${hour}:${minute}`;
  elements.timePeriod.textContent = dayPeriod.toLowerCase();
  elements.currentDate.textContent = dateFormatter.format(now);
  elements.todayNumber.textContent = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: timezone
  }).format(now);
}

function renderAll() {
  renderProfileAndWeather(state.data);
  renderMonthCalendar(state.data.holidays || []);
  renderCalendar(state.data.calendar || []);
  renderCountdowns(state.data.countdowns || []);
  renderDailyCard(state.data.dailyCard);
  renderSummerSchedule();
}

function renderProfileAndWeather(data) {
  const city = data.profile?.city || "Shanghai";
  const weather = data.weather || FALLBACK_DATA.weather;

  applySkyTheme(weather, data.profile);
  elements.cityLine.textContent = city;
  elements.heroCity.textContent = city;
  elements.heroCondition.textContent = weather.condition || "Weather";
  elements.weatherSummary.textContent = `${weather.condition || "Cloudy"} / ${weather.temperature ?? "--"}°C · H ${weather.high ?? "--"}° L ${weather.low ?? "--"}°`;
  elements.sunrise.textContent = weather.sunrise || "--:--";
  elements.sunset.textContent = weather.sunset || "--:--";
  elements.humidity.textContent = `${weather.humidity ?? "--"}%`;
  elements.aqi.textContent = `${weather.aqi ?? "--"}`;
  elements.feelsLike.textContent = `${weather.feelsLike ?? "--"}°C`;
  elements.wind.textContent = weather.wind || "--";
  updateWeatherMeters(weather);
  renderForecast(weather);
}

async function refreshLiveWeather() {
  const provider = state.data.integrations?.weatherProvider;
  if (!provider?.enabled || provider.type !== "open-meteo") {
    return;
  }

  try {
    const weather = await fetchOpenMeteoWeather(provider, state.data.profile);
    state.data.weather = {
      ...state.data.weather,
      ...weather
    };
    renderProfileAndWeather(state.data);
  } catch (error) {
    state.data.weather = {
      ...state.data.weather,
      condition: "Weather Offline",
      forecast: []
    };
    renderProfileAndWeather(state.data);
    console.warn("Live weather unavailable:", error);
  }
}

async function fetchOpenMeteoWeather(provider, profile) {
  const params = new URLSearchParams({
    latitude: String(provider.latitude),
    longitude: String(provider.longitude),
    timezone: profile?.timezone || "auto",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    forecast_days: "3"
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo returned ${response.status}`);
  }
  const data = await response.json();
  return normalizeOpenMeteoWeather(data);
}

function normalizeOpenMeteoWeather(data) {
  const currentCode = Number(data.current?.weather_code ?? 3);
  const daily = data.daily || {};
  return {
    condition: weatherCodeLabel(currentCode),
    temperature: Math.round(Number(data.current?.temperature_2m ?? 0)),
    high: Math.round(Number(daily.temperature_2m_max?.[0] ?? data.current?.temperature_2m ?? 0)),
    low: Math.round(Number(daily.temperature_2m_min?.[0] ?? data.current?.temperature_2m ?? 0)),
    feelsLike: Math.round(Number(data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 0)),
    humidity: Math.round(Number(data.current?.relative_humidity_2m ?? 0)),
    sunrise: formatApiTime(daily.sunrise?.[0]),
    sunset: formatApiTime(daily.sunset?.[0]),
    wind: `${windDirectionLabel(data.current?.wind_direction_10m)} ${Math.round(Number(data.current?.wind_speed_10m ?? 0))} km/h`,
    forecast: (daily.time || []).slice(0, 3).map((date, index) => ({
      date,
      label: index === 0 ? "Today" : formatForecastLabel(date, index),
      condition: weatherCodeLabel(Number(daily.weather_code?.[index] ?? currentCode)),
      high: Math.round(Number(daily.temperature_2m_max?.[index] ?? 0)),
      low: Math.round(Number(daily.temperature_2m_min?.[index] ?? 0))
    }))
  };
}

function weatherCodeLabel(code) {
  if ([0].includes(code)) return "Clear";
  if ([1, 2].includes(code)) return "Partly Cloudy";
  if ([3, 45, 48].includes(code)) return "Cloudy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather";
}

function formatApiTime(value) {
  if (!value) {
    return "--:--";
  }
  return String(value).slice(11, 16);
}

function windDirectionLabel(degrees) {
  const value = Number(degrees);
  if (!Number.isFinite(value)) {
    return "--";
  }
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round(value / 45) % 8];
}

function updateWeatherMeters(weather) {
  const humidityLevel = clamp(Number(weather.humidity || 0), 0, 100);
  const aqiLevel = clamp(Number(weather.aqi || 0) / 150 * 100, 0, 100);
  const feelsLevel = clamp(Number(weather.feelsLike || weather.temperature || 0) / 42 * 100, 0, 100);
  const windValue = Number(String(weather.wind || "").match(/\d+(\.\d+)?/)?.[0] || 0);
  const windLevel = clamp(windValue / 40 * 100, 0, 100);

  document.documentElement.style.setProperty("--humidity-meter", `${humidityLevel}%`);
  document.documentElement.style.setProperty("--aqi-meter", `${aqiLevel}%`);
  document.documentElement.style.setProperty("--feels-meter", `${feelsLevel}%`);
  document.documentElement.style.setProperty("--wind-meter", `${windLevel}%`);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderForecast(weather) {
  const forecast = normalizeForecast(weather);
  elements.forecastList.innerHTML = "";

  forecast.slice(0, 3).forEach((day, index) => {
    const item = document.createElement("article");
    item.className = `forecast-item${index === 0 ? " is-today" : ""}`;
    item.innerHTML = `
      <div>
        <p class="forecast-day"></p>
        <p class="forecast-condition"></p>
      </div>
      <strong class="forecast-range"></strong>
    `;
    item.querySelector(".forecast-day").textContent = day.label || formatForecastLabel(day.date, index);
    item.querySelector(".forecast-condition").textContent = day.condition || weather.condition || "Weather";
    item.querySelector(".forecast-range").textContent = `${day.high ?? "--"}° / ${day.low ?? "--"}°`;
    elements.forecastList.append(item);
  });
}

function normalizeForecast(weather) {
  const forecast = Array.isArray(weather.forecast) ? weather.forecast : [];
  const currentOrFuture = forecast.filter((day) => {
    const date = parseLocalDate(day.date);
    return !date || date >= startOfToday();
  });

  if (currentOrFuture.length) {
    return currentOrFuture;
  }

  return [
    {
      label: "Today",
      condition: weather.condition,
      high: weather.high,
      low: weather.low
    }
  ];
}

function formatForecastLabel(dateString, fallbackIndex) {
  const date = parseLocalDate(dateString);
  if (!date) {
    return fallbackIndex === 0 ? "Today" : `Day ${fallbackIndex + 1}`;
  }

  if (isSameLocalDay(date, startOfToday())) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function applySkyTheme(weather, profile) {
  const theme = getSkyTheme(weather, profile);
  document.body.classList.remove("sky-day", "sky-night", "sky-cloudy", "sky-rain");
  document.body.classList.add(theme.time);

  if (theme.weather) {
    document.body.classList.add(theme.weather);
  }
}

function getSkyTheme(weather, profile) {
  const localMinutes = getLocalMinutes(profile?.timezone);
  const sunriseMinutes = parseClockMinutes(weather?.sunrise);
  const sunsetMinutes = parseClockMinutes(weather?.sunset);
  const condition = String(weather?.condition || "").toLowerCase();

  const isNight = sunriseMinutes !== null && sunsetMinutes !== null
    ? localMinutes < sunriseMinutes || localMinutes >= sunsetMinutes
    : localMinutes < 360 || localMinutes >= 1140;

  let weatherClass = "";
  if (/rain|shower|storm|drizzle|雨|雷/.test(condition)) {
    weatherClass = "sky-rain";
  } else if (/cloud|overcast|fog|mist|阴|云|雾/.test(condition)) {
    weatherClass = "sky-cloudy";
  }

  return {
    time: isNight ? "sky-night" : "sky-day",
    weather: weatherClass
  };
}

function getLocalMinutes(timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function parseClockMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function renderMonthCalendar(holidays) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const holidayMap = new Map(
    holidays
      .map((holiday) => ({ ...holiday, dateObject: parseLocalDate(holiday.date) }))
      .filter((holiday) => holiday.dateObject && holiday.dateObject.getFullYear() === year && holiday.dateObject.getMonth() === month)
      .map((holiday) => [holiday.dateObject.getDate(), holiday.label])
  );
  const eventDayMap = new Map(
    (state.data.calendar || [])
      .map((event) => ({ ...event, dateObject: parseLocalDate(event.date) }))
      .filter((event) => isManualCalendarEvent(event) && event.dateObject && event.dateObject.getFullYear() === year && event.dateObject.getMonth() === month)
      .map((event) => [event.dateObject.getDate(), event.title])
  );

  elements.monthLabel.textContent = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(now);

  elements.monthCalendar.innerHTML = "";

  ["S", "M", "T", "W", "T", "F", "S"].forEach((day) => {
    const label = document.createElement("span");
    label.className = "month-weekday";
    label.textContent = day;
    elements.monthCalendar.append(label);
  });

  for (let index = 0; index < leadingBlanks; index += 1) {
    const blank = document.createElement("span");
    blank.className = "month-day is-empty";
    elements.monthCalendar.append(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const holidayLabel = holidayMap.get(day);
    const eventTitle = eventDayMap.get(day);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = [
      "month-day",
      isWeekend ? "is-weekend" : "",
      holidayLabel ? "is-holiday" : "",
      eventTitle ? "has-event" : "",
      day === todayDate ? "is-today" : ""
    ].filter(Boolean).join(" ");
    cell.textContent = day;
    cell.dataset.date = formatDateInput(date);
    cell.title = eventTitle || holidayLabel || "";
    cell.setAttribute("aria-label", eventTitle ? `${day}, ${eventTitle}` : holidayLabel ? `${day}, ${holidayLabel}` : `${day}`);
    elements.monthCalendar.append(cell);
  }
}

function renderCalendar(events) {
  const today = startOfToday();
  const limit = getLayoutMode().compactLandscape ? 4 : 5;
  const upcoming = events
    .map((event, sourceIndex) => ({ ...event, sourceIndex, dateObject: parseLocalDate(event.date) }))
    .filter((event) => event.dateObject && event.dateObject >= today)
    .sort((a, b) => a.dateObject - b.dateObject || String(a.time).localeCompare(String(b.time)))
    .slice(0, limit);

  elements.calendarList.innerHTML = "";

  if (!upcoming.length) {
    elements.calendarList.append(createEmptyLine("No upcoming events"));
    return;
  }

  upcoming.forEach((event) => {
    const row = document.createElement("article");
    row.className = `event${isSameLocalDay(event.dateObject, today) ? " is-today" : ""}`;
    row.dataset.eventIndex = String(event.sourceIndex);
    row.tabIndex = 0;
    row.innerHTML = `
      <span class="event-marker" aria-hidden="true"></span>
      <div>
        <p class="event-title"></p>
        <p class="event-meta"></p>
      </div>
      <span class="event-type"></span>
    `;
    row.querySelector(".event-title").textContent = event.title || "Untitled";
    row.querySelector(".event-meta").textContent = `${formatShortDate(event.dateObject)} · ${event.time || "All day"}`;
    row.querySelector(".event-type").textContent = event.type || "";
    elements.calendarList.append(row);
  });
}

function renderCountdowns(countdowns) {
  elements.countdownList.innerHTML = "";

  const limit = getLayoutMode().compactLandscape ? 3 : 4;

  countdowns.slice(0, limit).forEach((item, index) => {
    const days = daysUntil(item.targetDate);
    const row = document.createElement("article");
    row.className = "countdown";
    row.dataset.countdownIndex = String(index);
    row.tabIndex = 0;
    row.innerHTML = `
      <span class="event-marker" aria-hidden="true"></span>
      <div>
        <p class="countdown-title"></p>
        <p class="countdown-subtitle"></p>
      </div>
      <strong class="countdown-days"></strong>
    `;
    row.querySelector(".countdown-title").textContent = item.title || "Countdown";
    row.querySelector(".countdown-subtitle").textContent = item.subtitle || "";
    row.querySelector(".countdown-days").innerHTML = `${days}<span>days</span>`;
    elements.countdownList.append(row);
  });
}

function getLayoutMode() {
  return {
    compactLandscape: window.matchMedia("(orientation: landscape) and (max-width: 1180px), (orientation: landscape) and (max-height: 760px)").matches
  };
}

function debounce(callback, delay) {
  let timer;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(callback, delay);
  };
}

function wireEditors() {
  elements.calendarList.addEventListener("click", (event) => {
    const row = event.target.closest(".event");
    if (row?.dataset.eventIndex) {
      openEventEditor(Number(row.dataset.eventIndex));
    }
  });

  elements.calendarList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    const row = event.target.closest(".event");
    if (row?.dataset.eventIndex) {
      openEventEditor(Number(row.dataset.eventIndex));
    }
  });

  elements.monthCalendar.addEventListener("click", (event) => {
    const day = event.target.closest(".month-day:not(.is-empty)");
    if (day?.dataset.date) {
      openEventEditor(null, day.dataset.date);
    }
  });

  elements.countdownList.addEventListener("click", (event) => {
    const row = event.target.closest(".countdown");
    if (row?.dataset.countdownIndex) {
      openCountdownEditor(Number(row.dataset.countdownIndex));
    }
  });

  elements.countdownList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    const row = event.target.closest(".countdown");
    if (row?.dataset.countdownIndex) {
      openCountdownEditor(Number(row.dataset.countdownIndex));
    }
  });

  elements.editClose.addEventListener("click", closeEditor);
  elements.editCancel.addEventListener("click", closeEditor);
  elements.editModal.addEventListener("click", (event) => {
    if (event.target === elements.editModal) {
      closeEditor();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.editModal.classList.contains("is-open")) {
      closeEditor();
    }
  });
}

function openEventEditor(index = null, presetDate = "") {
  const isNew = index === null;
  const event = isNew
    ? { title: "", date: presetDate || formatDateInput(new Date()), time: "19:00", type: "family" }
    : state.data.calendar[index];

  openEditor({
    title: isNew ? "ADD CALENDAR" : "EDIT CALENDAR",
    deleteLabel: isNew ? "" : "Delete",
    fields: [
      { name: "title", label: "TITLE", value: event.title || "", placeholder: "Dinner with friends" },
      { name: "date", label: "DATE", value: event.date || formatDateInput(new Date()), type: "date" },
      { name: "time", label: "TIME", value: event.time || "", type: "time" },
      { name: "type", label: "TYPE", value: event.type || "", placeholder: "family" }
    ],
    onSave(values) {
      const nextEvent = {
        title: values.title.trim() || "Untitled",
        date: values.date || formatDateInput(new Date()),
        time: values.time || "All day",
        type: values.type.trim() || "note",
        manual: isNew ? true : Boolean(event.manual)
      };

      if (isNew) {
        state.data.calendar.push(nextEvent);
      } else {
        state.data.calendar[index] = nextEvent;
      }
      saveEditableData();
      renderAll();
    },
    onDelete: isNew ? null : () => {
      state.data.calendar.splice(index, 1);
      saveEditableData();
      renderAll();
    }
  });
}

function openCountdownEditor(index) {
  const item = state.data.countdowns[index];

  openEditor({
    title: "EDIT COUNTDOWN",
    deleteLabel: "Delete",
    fields: [
      { name: "title", label: "TITLE", value: item.title || "", placeholder: "Next Family Trip" },
      { name: "targetDate", label: "TARGET DATE", value: item.targetDate || formatDateInput(new Date()), type: "date" },
      { name: "subtitle", label: "SUBTITLE", value: item.subtitle || "", placeholder: "The next journey begins." }
    ],
    onSave(values) {
      state.data.countdowns[index] = {
        title: values.title.trim() || "Countdown",
        targetDate: values.targetDate || formatDateInput(new Date()),
        subtitle: values.subtitle.trim()
      };
      saveEditableData();
      renderAll();
    },
    onDelete() {
      state.data.countdowns.splice(index, 1);
      saveEditableData();
      renderAll();
    }
  });
}

function openEditor(config) {
  elements.editTitle.textContent = config.title;
  elements.editFields.innerHTML = config.fields.map((field) => `
    <label class="edit-field">
      <span>${field.label}</span>
      <input name="${field.name}" type="${field.type || "text"}" value="${escapeAttribute(field.value || "")}" placeholder="${escapeAttribute(field.placeholder || "")}">
    </label>
  `).join("");

  elements.editDelete.hidden = !config.onDelete;
  elements.editDelete.textContent = config.deleteLabel || "Delete";

  elements.editForm.onsubmit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(elements.editForm).entries());
    config.onSave(values);
    closeEditor();
  };

  elements.editDelete.onclick = () => {
    if (config.onDelete) {
      config.onDelete();
    }
    closeEditor();
  };

  elements.editModal.classList.add("is-open");
  elements.editModal.setAttribute("aria-hidden", "false");
  elements.editFields.querySelector("input")?.focus();
}

function closeEditor() {
  elements.editModal.classList.remove("is-open");
  elements.editModal.setAttribute("aria-hidden", "true");
}

function applySavedEdits(data) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Array.isArray(saved.calendar)) {
      data.calendar = saved.calendar;
    }
    if (Array.isArray(saved.countdowns)) {
      data.countdowns = saved.countdowns;
    }
  } catch (error) {
    console.warn("Unable to read saved dashboard edits:", error);
  }
  return data;
}

function saveEditableData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      calendar: state.data.calendar,
      countdowns: state.data.countdowns
    }));
  } catch (error) {
    console.warn("Unable to save dashboard edits:", error);
  }
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function isManualCalendarEvent(event) {
  return event.manual === true;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderDailyCard(card) {
  if (!card) {
    return;
  }

  elements.dailyLabel.textContent = card.label || "Daily Card";
  elements.dailyWord.textContent = card.word || "";
  elements.dailyMeaning.textContent = card.meaning || "";
  elements.dailyExample.textContent = card.example || "";
}

function renderSummerSchedule() {
  const schedule = state.data.summerSchedule;
  if (!schedule?.days?.length || !elements.scheduleList) {
    return;
  }

  const todayKey = getTodayScheduleKey();
  const activeKey = state.selectedScheduleDay || todayKey;
  const activeDay = schedule.days.find((day) => day.key === activeKey) || schedule.days[0];
  state.selectedScheduleDay = activeDay.key;

  elements.scheduleDate.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: state.data.profile?.timezone
  }).format(new Date());
  elements.scheduleDayName.textContent = activeDay.label;

  elements.scheduleTabs.innerHTML = "";
  schedule.days.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "schedule-tab",
      day.key === activeDay.key ? "is-active" : "",
      day.key === todayKey ? "is-today" : ""
    ].filter(Boolean).join(" ");
    button.textContent = day.label;
    button.dataset.day = day.key;
    elements.scheduleTabs.append(button);
  });

  elements.scheduleList.innerHTML = "";
  activeDay.items.forEach((item) => {
    const row = document.createElement("article");
    row.className = `schedule-item schedule-${item.type || "default"}`;
    row.innerHTML = `
      <time></time>
      <div>
        <p></p>
        <span></span>
      </div>
    `;
    row.querySelector("time").textContent = item.time || "";
    row.querySelector("p").textContent = item.title || "";
    row.querySelector("span").textContent = scheduleTypeLabel(item.type);
    elements.scheduleList.append(row);
  });
}

function wirePageSwipe() {
  document.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    state.touchStartX = touch.clientX;
    state.touchStartY = touch.clientY;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - state.touchStartX;
    const dy = touch.clientY - state.touchStartY;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.2) {
      return;
    }
    setPageIndex(dx > 0 ? 1 : 0);
  }, { passive: true });

  elements.pageDots?.addEventListener("click", (event) => {
    const dot = event.target.closest(".page-dot");
    if (!dot?.dataset.page) {
      return;
    }
    setPageIndex(Number(dot.dataset.page));
  });

  elements.scheduleTabs?.addEventListener("click", (event) => {
    const button = event.target.closest(".schedule-tab");
    if (!button?.dataset.day) {
      return;
    }
    state.selectedScheduleDay = button.dataset.day;
    renderSummerSchedule();
  });
}

function setPageIndex(index) {
  state.pageIndex = Math.max(0, Math.min(1, index));
  elements.pageTrack.style.transform = `translate3d(${-100 * state.pageIndex}vw, 0, 0)`;
  elements.pageDots?.querySelectorAll(".page-dot").forEach((dot) => {
    dot.classList.toggle("is-active", Number(dot.dataset.page) === state.pageIndex);
  });
}

function getTodayScheduleKey() {
  const order = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: state.data.profile?.timezone
  }).format(new Date()).toLowerCase();
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  return order[map[weekday.slice(0, 3)] ?? new Date().getDay()];
}

function scheduleTypeLabel(type) {
  const labels = {
    study: "Study",
    sport: "Sport",
    home: "Home",
    music: "Music",
    play: "Play",
    rest: "Rest"
  };
  return labels[type] || "Plan";
}

function createEmptyLine(message) {
  const line = document.createElement("p");
  line.className = "event-meta";
  line.textContent = message;
  return line;
}

function daysUntil(dateString) {
  const target = parseLocalDate(dateString);
  if (!target) {
    return 0;
  }

  const difference = target.getTime() - startOfToday().getTime();
  return Math.max(0, Math.ceil(difference / 86400000));
}

function parseLocalDate(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || "");
  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}
