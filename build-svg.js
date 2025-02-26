const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

let fs = require("fs");
let formatDistance = require("date-fns/formatDistance");
let weather = require("openweather-apis");
let qty = require("js-quantities");

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

// Today's weather
weather.setLang("en");
weather.setCoordinate(37.517235, 127.047325); // 서울 좌표
weather.setUnits("imperial");
weather.setAPPID(WEATHER_API_KEY);

weather.getCurrentWeather((err, data) => {
  if (err) {
    console.error("❌ ERROR: Unable to fetch weather data:", err);
    return;
  }

  if (!data || !data.main || !data.weather) {
    console.error("❌ ERROR: Invalid weather data received. Please check your API key.");
    return;
  }

  const degF = Math.round(data.main.temp);
  const degC = Math.round((degF - 32) * 5 / 9); // 화씨 -> 섭씨 변환
  const icon = data.weather[0].icon;

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
});
