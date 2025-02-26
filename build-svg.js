const fs = require("fs");
const https = require("https");
const formatDistance = require("date-fns/formatDistance");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const CITY = "Seoul"; // 원하는 도시 이름
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
function fetchWeather() {
  https.get(API_URL, (res) => {
    let data = "";

    // 데이터 수신 중
    res.on("data", (chunk) => {
      data += chunk;
    });

    // 응답 완료
    res.on("end", () => {
      try {
        const weatherData = JSON.parse(data);
        if (!weatherData || !weatherData.main || !weatherData.weather) {
          throw new Error("Invalid weather data received. Please check your API key.");
        }

        const degF = Math.round(weatherData.main.temp);
        const degC = Math.round((degF - 32) * 5 / 9);
        const icon = weatherData.weather[0].icon;

        updateSVG(degF, degC, icon);
      } catch (error) {
        console.error("❌ ERROR: ", error.message);
      }
    });
  }).on("error", (error) => {
    console.error("❌ ERROR: Unable to fetch weather data:", error.message);
  });
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
