const controller = new AbortController();

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

document.addEventListener("DOMContentLoaded", () => {
  const dialogBox = document.getElementById("dialog-box");
  const query = { active: true, currentWindow: true };

  chrome.tabs.query(query, async (tabs) => {
    const today = getNepToday();
    const weather = await getWeather();
    const currentWeather = weather?.current?.condition || {
      icon: "",
      text: "-",
    };
    const weatherForecast = weather?.forecast?.forecastday || [];
    dialogBox.innerHTML = getConvertedDate(
      today,
      currentWeather,
      weatherForecast
    );
  });
});

const getConvertedDate = (today, currentWeather, weatherForecast) => {
  let forecast = "";
  forecast += weatherForecast.map((weather) => {
    return `<div class="cardWrapper">
    <img src=https:${weather?.day?.condition?.icon} alt=${
      weather?.day?.condition?.text
    } width=30 height=30/>
    <div style="font-size: 0.7em"><em>${
      weather?.day?.condition?.text
    }</em></div>
    <div class="stickAtBottom">
    <strong>
    ${days.find((day, i) => {
      if (i === new Date(weather?.date).getDay()) return day;
    })}
      </strong>
    </div>
  </div>`;
  });
  forecast = forecast.replace(/,/g, "");
  if (currentWeather.icon) {
    return `<span>
    <h1>${today.nepDate}</h1>
    ${today.engDate}
  </span>
  <br>
  <div id="wrapper">
  <div class="cardWrapper">
    <img src=https:${currentWeather?.icon || "Nop"} alt=${
      currentWeather.text
    } width=30 height=30/>
    <div style="font-size: 0.7em"><em>${currentWeather.text}</em></div>
    <div class="stickAtBottom">
    <strong>
      ${days.find((day, i) => {
        if (i === new Date().getDay()) return day;
      })}
      </strong>
    </div>
  </div>
  ${forecast}
  </div>`;
  } else
    return `<span>
  <h1>${today.nepDate}</h1>
  ${today.engDate}
</span>
<br>
<div style="margin-top: 25px">
<span><em>Weather Data Not Found!</em></span>
</div>
`;
};

const getNepToday = () => {
  const currentDate = new Date();
  const currentNepaliDate = calendarFunctions.getBsDateByAdDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );
  const formatedNepaliDate = calendarFunctions.bsDateFormat(
    "%y %M, %d %D",
    currentNepaliDate.bsYear,
    currentNepaliDate.bsMonth,
    currentNepaliDate.bsDate
  );

  return {
    engDate: new Date().toDateString() || "-",
    nepDate: formatedNepaliDate || "-",
  };
};

const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  if (signal) signal.addEventListener("abort", () => controller.abort());
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

async function getWeather() {
  const apiKey = "";
  const location = "Kathmandu";
  const response = await fetchTimeout(
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=4&aqi=no&alerts=no`,
    3000,
    { signal: controller.signal }
  ).catch((error) => {
    console.log(error);
  });
  if (!response) return { location: "", current: "", forecast: "" };
  const weather = await response.json();
  return weather;
}
