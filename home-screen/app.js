const FALLBACK_DATA = {
  profile: {
    city: "Shanghai",
    timezone: "Asia/Shanghai"
  },
  integrations: {
    publicIcalUrl: ""
  },
  weather: {
    condition: "Cloudy",
    temperature: 27,
    high: 31,
    low: 24,
    feelsLike: 29,
    humidity: 68,
    aqi: 42,
    sunrise: "05:01",
    sunset: "19:04",
    wind: "SE 12 km/h",
    forecast: [
      {
        date: "2026-06-28",
        label: "Today",
        condition: "Cloudy",
        high: 31,
        low: 24
      },
      {
        date: "2026-06-29",
        label: "Mon",
        condition: "Light Rain",
        high: 29,
        low: 23
      },
      {
        date: "2026-06-30",
        label: "Tue",
        condition: "Partly Cloudy",
        high: 32,
        low: 25
      }
    ]
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

const state = {
  data: FALLBACK_DATA
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
  dailyExample: document.querySelector("#dailyExample")
};

init();

async function init() {
  tickClock();
  setInterval(tickClock, 1000);

  state.data = await loadData();
  renderAll();

  // A light refresh keeps long-running screen mode current without rebuilding the page.
  setInterval(renderAll, 30000);
}

async function loadData() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`data.json returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using fallback dashboard data:", error);
    return FALLBACK_DATA;
  }
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
  if (Array.isArray(weather.forecast) && weather.forecast.length) {
    return weather.forecast;
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
    const cell = document.createElement("span");
    cell.className = [
      "month-day",
      isWeekend ? "is-weekend" : "",
      holidayLabel ? "is-holiday" : "",
      day === todayDate ? "is-today" : ""
    ].filter(Boolean).join(" ");
    cell.textContent = day;
    cell.title = holidayLabel || "";
    cell.setAttribute("aria-label", holidayLabel ? `${day}, ${holidayLabel}` : `${day}`);
    elements.monthCalendar.append(cell);
  }
}

function renderCalendar(events) {
  const today = startOfToday();
  const upcoming = events
    .map((event) => ({ ...event, dateObject: parseLocalDate(event.date) }))
    .filter((event) => event.dateObject && event.dateObject >= today)
    .sort((a, b) => a.dateObject - b.dateObject || String(a.time).localeCompare(String(b.time)))
    .slice(0, 5);

  elements.calendarList.innerHTML = "";

  if (!upcoming.length) {
    elements.calendarList.append(createEmptyLine("No upcoming events"));
    return;
  }

  upcoming.forEach((event) => {
    const row = document.createElement("article");
    row.className = `event${isSameLocalDay(event.dateObject, today) ? " is-today" : ""}`;
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

  countdowns.slice(0, 4).forEach((item) => {
    const days = daysUntil(item.targetDate);
    const row = document.createElement("article");
    row.className = "countdown";
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

function renderDailyCard(card) {
  if (!card) {
    return;
  }

  elements.dailyLabel.textContent = card.label || "Daily Card";
  elements.dailyWord.textContent = card.word || "";
  elements.dailyMeaning.textContent = card.meaning || "";
  elements.dailyExample.textContent = card.example || "";
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
