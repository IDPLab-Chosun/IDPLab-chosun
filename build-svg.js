import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import formatDistance from 'date-fns/formatDistance';
import weather from 'openweather-apis';

dotenv.config();  // .env 파일 로드

console.log("API Key:", process.env.WEATHER_API_KEY ? "Loaded" : "Not Found");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const emojis = {
  '01d': '☀️', '02d': '⛅️', '03d': '☁️', '04d': '☁️',
  '09d': '🌧', '10d': '🌦', '11d': '🌩', '13d': '❄️', '50d': '🌫'
};

// 시간 변환 함수
function convertTZ(date, tzString) {
  return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

// 오늘 날짜 가져오기
const today = convertTZ(new Date(), "Asia/Seoul");
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
const psTime = formatDistance(new Date(2020, 11, 14), today, { addSuffix: false }); // 2020-12-14 시작

// 날씨 API 설정
weather.setLang('en');
weather.setCity('Seoul');  // getAllWeather() 사용 시 도시 설정 필요
weather.setUnits('metric');
weather.setAPPID(WEATHER_API_KEY);

async function fetchWeatherAndUpdateSVG() {
  try {
    // 날씨 데이터 가져오기
    const data = await new Promise((resolve, reject) => {
      weather.getAllWeather((err, data) => {
        if (err) {
          console.error("날씨 데이터를 가져오는 중 오류 발생:", err);
          return reject(err);
        }
        resolve(data);
      });
    });

    // API 데이터 구조 확인 및 수정
    const degC = Math.round(data.main.temp); // getAllWeather()는 main.temp 사용
    const icon = data.weather[0].icon;

    // SVG 템플릿 읽기
    let svgData = await fs.readFile('template.svg', 'utf-8');

    // 데이터 삽입
    svgData = svgData
      .replace('{degC}', degC)
      .replace('{weatherEmoji}', emojis[icon] || '❓')
      .replace('{psTime}', psTime)
      .replace('{todayDay}', todayDay);

    // SVG 파일 저장
    await fs.writeFile('chat.svg', svgData);
    console.log("✅ SVG 파일이 성공적으로 업데이트되었습니다.");
    fs.writeFileSync('chat.svg', svgData);
    console.log("✅ (동기 방식) chat.svg 파일 저장 완료!");
    fs.access('chat.svg', fs.constants.F_OK, (err) => {
      if (err) {
        console.error("🚨 chat.svg 파일이 존재하지 않습니다!", err);
      } else {
        console.log("✅ chat.svg 파일이 존재합니다!");
      }
    });
  } catch (error) {
    console.error("🚨 오류 발생:", error);
  }
}

// 실행
fetchWeatherAndUpdateSVG();
