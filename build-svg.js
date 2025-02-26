const fs = require("fs");
const formatDistance = require("date-fns/formatDistance");
const fetch = require("node-fetch"); // 직접 API 요청
const qty = require("js-quantities");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const CITY = "Seoul"; // 변경 가능
const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=imperial`;

const emojis = {
  "01d": "☀️",
  "02d": "⛅️",
  "03d": "☁️",
  "04d": "☁️",
  "09d": "🌧",
  "10d": "🌦",
  "11d": "🌩",
  "13d": "❄️",
  "50d": "🌫",
};

// API 키 확인
if (!WEATHER_API_KEY) {
  console.error("❌ ERROR: WEATHER_API_KEY is not defined. Please check your GitHub Secrets.");
  process.exit(1);
}

// Time working at PlanetScale
function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
}

const today = convertTZ(new Date(), "Asia/Seoul");
const todayDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(today);
const psTime = formatDistance(new Date(2020, 12, 14), today, {
  addSuffix: false,
});

// OpenWeather API 요청
async function fetchWeather() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);

    const data = await response.json();
    if (!data || !data.main || !data.weather) {
      throw new Error("Invalid weather data received. Please check your API key.");
    }

    const degF = Math.round(data.main.temp);
    const degC = Math.round((degF - 32) * 5 / 9);
    const icon = data.weather[0].icon;

    updateSVG(degF, degC, icon);
  } catch (error) {
    console.error("❌ ERROR: ", error);
  }
}

// SVG 업데이트
function updateSVG(degF, degC, icon) {
  fs.readFile("template.svg", "utf-8", (error, svgData) => {
    if (error) {
      console.error("❌ ERROR: Unable to read template.svg:", error);
      return;
    }

    svgData = svgData.replace("{degF}", degF);
    svgData = svgData.replace("{degC}", degC);
    svgData = svgData.replace("{weatherEmoji}", emojis[icon] || "❓");
    svgData = svgData.replace("{psTime}", psTime);
    svgData = svgData.replace("{todayDay}", todayDay);

    fs.writeFile("chat.svg", svgData, (err) => {
      if (err) {
        console.error("❌ ERROR: Unable to write chat.svg:", err);
      } else {
        console.log("✅ Successfully updated chat.svg with current weather data.");
      }
    });
  });
}

// 실행
fetchWeather();
