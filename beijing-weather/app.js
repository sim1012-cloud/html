const BEIJING = {
  latitude: 39.9042,
  longitude: 116.4074,
  timezone: 'Asia/Shanghai',
};

const weatherCodeText = {
  0: '晴朗',
  1: '大部晴朗',
  2: '局部多云',
  3: '阴天',
  45: '有雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '中等毛毛雨',
  55: '浓毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '短时小阵雨',
  81: '阵雨',
  82: '强阵雨',
  95: '雷雨',
  96: '雷雨伴冰雹',
  99: '强雷雨伴冰雹',
};

const elements = {
  status: document.querySelector('#status'),
  condition: document.querySelector('#condition'),
  updatedAt: document.querySelector('#updatedAt'),
  temperature: document.querySelector('#temperature'),
  feelsLike: document.querySelector('#feelsLike'),
  humidity: document.querySelector('#humidity'),
  windSpeed: document.querySelector('#windSpeed'),
  windDirection: document.querySelector('#windDirection'),
  forecastList: document.querySelector('#forecastList'),
  refreshButton: document.querySelector('#refreshButton'),
};

function formatDateTime(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: BEIJING.timezone,
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatWeekday(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: BEIJING.timezone,
    weekday: 'long',
  }).format(new Date(value));
}

function windDirectionText(degrees) {
  const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  return directions[Math.round(degrees / 45) % 8];
}

function apiUrl() {
  const params = new URLSearchParams({
    latitude: BEIJING.latitude,
    longitude: BEIJING.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: BEIJING.timezone,
    forecast_days: '3',
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function renderForecast(daily) {
  elements.forecastList.innerHTML = daily.time.map((date, index) => {
    const condition = weatherCodeText[daily.weather_code[index]] ?? '天气变化';
    return `
      <article class="forecast-day">
        <span>${index === 0 ? '今天' : formatWeekday(date)}</span>
        <strong>${condition}</strong>
        <p>${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°</p>
      </article>
    `;
  }).join('');
}

async function loadWeather() {
  elements.status.textContent = '正在获取北京实时天气...';
  elements.refreshButton.disabled = true;

  try {
    const response = await fetch(apiUrl());
    if (!response.ok) {
      throw new Error(`天气服务返回 ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    elements.condition.textContent = weatherCodeText[current.weather_code] ?? '天气变化';
    elements.updatedAt.textContent = `更新时间 ${formatDateTime(current.time)}`;
    elements.temperature.textContent = Math.round(current.temperature_2m);
    elements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    elements.humidity.textContent = `${current.relative_humidity_2m}%`;
    elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    elements.windDirection.textContent = windDirectionText(current.wind_direction_10m);
    renderForecast(data.daily);
    elements.status.textContent = '数据来源：Open-Meteo，自动按北京时间显示。';
  } catch (error) {
    elements.status.textContent = `暂时无法获取天气：${error.message}`;
  } finally {
    elements.refreshButton.disabled = false;
  }
}

elements.refreshButton.addEventListener('click', loadWeather);
loadWeather();
