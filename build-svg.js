import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import formatDistance from 'date-fns/formatDistance';
import weather from 'openweather-apis';

dotenv.config();  // .env 파일 로드

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
weather.setCoordinate(37.517235, 127.047325);
weather.setUnits('imperial');
weather.setAPPID(WEATHER_API_KEY);

async function fetchWeatherAndUpdateSVG() {
  return new Promise((resolve, reject) => {
    weather.getWeatherOneCall(async (err, data) => {
      if (err) {
        console.error("날씨 데이터를 가져오는 중 오류 발생:", err);
        return reject(err);
      }

      const degF = Math.round(data.daily[0].temp.max);
      const degC = Math.round((degF - 32) * 5 / 9);
      const icon = data.daily[0].weather[0].icon;

      try {
        let svgData = await fs.readFile('template.svg', 'utf-8');

        svgData = svgData
          .replace('{degF}', degF)
          .replace('{degC}', degC)
          .replace('{weatherEmoji}', emojis[icon] || '❓')
          .replace('{psTime}', psTime)
          .replace('{todayDay}', todayDay);

        await fs.writeFile('chat.svg', svgData);
        console.log("SVG 파일이 성공적으로 업데이트되었습니다.");
        resolve();
      } catch (fileError) {
        console.error("파일 처리 중 오류 발생:", fileError);
        reject(fileError);
      }
    });
  });
}

// 실행
fetchWeatherAndUpdateSVG();
