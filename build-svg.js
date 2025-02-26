const fs = require("fs").promises; // 비동기 파일 시스템 사용
const https = require("https");
const formatDistance = require("date-fns/formatDistance");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const CITY = "Seoul"; // 변경 가능
const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=imperial`;

const emojis = {
  "01d": "☀️", "02d": "⛅️", "03d": "☁️", "04d": "☁️",
  "09d": "🌧", "10d": "🌦", "11d": "🌩", "13d": "❄️", "50d": "🌫",
};

// API 키 확인
if (!WEATHER_API_KEY) {
  console.error("❌ ERROR: WEATHER_API_KEY is not defined. Please check your GitHub Secrets.");
  process.exit(1);
}

// Time working at PlanetScale
function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString })
  );
}

const today = convertTZ(new Date(), "Asia/Seoul");
const todayDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(today);
const psTime = formatDistance(new Date(2020, 12, 14), today, { addSuffix: false });

// OpenWeather API 요청
async function fetchWeather() {
  return new Promise((resolve, reject) => {
    https.get(API_URL, (res) => {
      let data = "";

      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const weatherData = JSON.parse(data);
          if (!weatherData || !weatherData.main || !weatherData.weather) {
            throw new Error("Invalid weather data received. Please check your API key.");
          }

          const degF = Math.round(weatherData.main.temp);
          const degC = Math.round((degF - 32) * 5 / 9);
          const icon = weatherData.weather[0].icon;
          resolve({ degF, degC, icon });
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", (error) => reject(error));
  });
}

// SVG 파일 생성 및 저장
async function generateSVG(degF, degC, icon) {
  const filePath = "template.svg";

  try {
    let svgData = await fs.readFile(filePath, "utf-8");

    svgData = svgData.replace("{degF}", degF);
    svgData = svgData.replace("{degC}", degC);
    svgData = svgData.replace("{weatherEmoji}", emojis[icon] || "❓");
    svgData = svgData.replace("{psTime}", psTime);
    svgData = svgData.replace("{todayDay}", todayDay);

    await fs.writeFile("chat.svg", svgData);
    console.log("✅ Successfully updated chat.svg with current weather data.");
  } catch (error) {
    console.error(`❌ ERROR: Unable to process SVG file: ${error.message}`);
  }
}

// 실행
(async () => {
  try {
    const { degF, degC, icon } = await fetchWeather();
    await generateSVG(degF, degC, icon);
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
  }
})();
