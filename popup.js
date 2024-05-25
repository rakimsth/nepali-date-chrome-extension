const controller = new AbortController();

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

document.addEventListener("DOMContentLoaded", () => {
  const dialogBox = document.getElementById("dialog-box");
  const query = { active: true, currentWindow: true };

  chrome.tabs.query(query, async (tabs) => {
    const today = getNepToday();
    dialogBox.innerHTML = dataToHtml(today);
    setTimeout(async () => {
      const metal = await getGoldPrice();
      const weather = await getWeather();
      const nav = await getNavPrice();
      const currentWeather = weather?.current?.condition || {
        icon: "",
        text: "-",
      };
      const weatherForecast = weather?.forecast?.forecastday || [];
      dialogBox.innerHTML = dataToHtml({
        today,
        currentWeather,
        weatherForecast,
        metal,
        nav,
      });
    }, 1000);
  });
});

const metalToHtml = (metal) => {
  return `
  <hr>
  <span style="color:#fff;background-color:#FFD700;font-size:0.9em;">
  Gold: ${metal.gold}
  </span>&nbsp;|
  <span style="color:#fff;background-color:#C0C0C0;font-size:0.9em;">
  Silver: ${metal.silver}
  </span>
  <br>
  <div style="font-size: 0.7em;text-align:right;">
  <i>
  Last Updated at: <strong>${metal.fetchDate}</strong> (location: Nepal)
  </i>
  </div>
  <hr>
  `;
};

const todayToHtml = (today) => {
  return `
  <span>
    <h1>${today.nepDate}</h1>
    ${today.engDate}
  </span>
  <br>`;
};

const weatherToHtml = ({ currentWeather, weatherForecast }) => {
  let forecast = "";
  forecast += weatherForecast.map((weather) => {
    return `
    <div class="cardWrapper">
      <img src=https:${weather?.day?.condition?.icon} alt=${
      weather?.day?.condition?.text
    } width=30 height=30/>
      <div style="font-size: 0.7em">
        <em>${weather?.day?.condition?.text}</em>
      </div>
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
    return `
    <div id="wrapper">
      <div class="cardWrapper">
        <img src=https:${currentWeather?.icon || "Nope"} alt=${
      currentWeather.text
    } width=30 height=30 />
        <div style="font-size: 0.7em">
          <em>${currentWeather.text}</em>
        </div>
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
  } else {
    return `<div style="margin-top: 25px">
    <span><em>Weather Data Not Found!</em></span>
  </div>`;
  }
};

const dataToHtml = ({ today, currentWeather, weatherForecast, metal, nav }) => {
  let toPrint = "";
  // Today
  if (today) {
    const todayData = todayToHtml(today);
    toPrint += todayData;
  }
  // Gold Data
  if (metal) {
    const metalData = metalToHtml(metal);
    toPrint += metalData;
  } else {
    toPrint += `
      <div style="margin-top: 25px">
        <span><em>loading gold data...</em></span>
      </div>`;
  }
  // Weather Data
  if (currentWeather && weatherForecast) {
    const weatherData = weatherToHtml({ currentWeather, weatherForecast });
    toPrint += weatherData;
  } else {
    toPrint += `
        <div style="margin-top: 25px">
        <span><em>loading weather data...</em></span>
        </div>`;
  }
  if (nav) {
    const navData = navToHtml(nav);
    toPrint += navData;
  } else {
    toPrint += `
      <div style="margin-top: 25px">
        <span><em>loading NAV data...</em></span>
      </div>`;
  }
  return toPrint;
};

const navToHtml = (nav) => {
  return `
  <hr>
  <span style="color:#fff;background-color:${nav?.color};font-size:0.9em;">
  NAV: ${nav?.nav}
  </span>|
  <span style="font-size:0.9em;">
  Difference: ${nav?.difference}
  </span>|
  <span style="font-size:0.9em;">
  %: ${nav?.diffPercent}
  </span>
  <a href="https://www.nimbacecapital.com/mutual-fund/nav-nibl-sahabhagita-fund" target="_blank">></a>
  <br>
  <div style="font-size: 0.7em;text-align:right;">
  <i>
  Last Updated at: <strong>${nav.fetchDate}</strong> (location: Nepal)
  </i>
  </div>
  <hr>
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
  const apiKey = "363f2d913b494842ab6163856220806";
  const location = "Kathmandu";
  const response = await fetchTimeout(
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=4&aqi=no&alerts=no`,
    3000,
    { signal: controller.signal }
  ).catch((error) => {
    console.log(error);
  });
  if (!response) return { location: "-", current: "-", forecast: "-" };
  const weather = await response.json();
  return weather;
}

async function getGoldPrice() {
  const response = await fetchTimeout(
    `https://www.sharesansar.com/bullion`,
    3000,
    {
      signal: controller.signal,
    }
  ).catch((error) => {
    console.log(error);
  });
  if (!response) return { fetchDate: "-", gold: "-", silver: "-" };
  const metals = await response.text();
  // Getting Gold Fetch Date
  const fetchIndex = metals.search(/As of/gi);
  const dateSearchIndex = fetchIndex + 29;
  const additionalIndex = dateSearchIndex + 10;
  const dateData = metals.substring(dateSearchIndex, additionalIndex);
  // Getting Gold Price
  const goldPriceIndex = metals.search(/<u>Fine Gold<\/u>/gi);
  const searchIndex = goldPriceIndex + 114;
  const additionalGPIndex = searchIndex + 14;
  let goldPriceData = metals.substring(searchIndex, additionalGPIndex);
  // Getting Silver Price
  const silverPriceIndex = metals.search(/<u>Silver<\/u>/gi);
  const searchSilverIndex = silverPriceIndex + 111;
  const additionalSPIndex = searchSilverIndex + 13;
  let silverPriceData = metals.substring(searchSilverIndex, additionalSPIndex);
  return { fetchDate: dateData, gold: goldPriceData, silver: silverPriceData };
}

async function getNavPrice() {
  const response = await fetchTimeout(
    `https://www.nimbacecapital.com/mutual-fund/nav-nibl-sahabhagita-fund`,
    3000,
    {
      signal: controller.signal,
    }
  ).catch((error) => {
    console.log(error);
  });

  if (!response)
    return {
      fetchDate: "-",
      nav: "-",
      difference: "-",
      diffPercent: "-",
      color: "-",
    };
  const navData = await response.text();
  // Getting NAV Fetch Date
  const fetchIndex = navData.search(/nibl-table id=nav>/gi);
  const dateSearchIndex = fetchIndex + 91;
  const additionalIndex = dateSearchIndex + 10;
  const date = navData.substring(dateSearchIndex, additionalIndex);

  // Getting NAV Color Data
  const colorSearchIndex = fetchIndex + 121;
  const additionalColorIndex = colorSearchIndex + 9;
  const colorLabel = navData.substring(colorSearchIndex, additionalColorIndex);
  const color = colorLabel.split("-")[1];

  // Getting NAV Data
  const navSearchIndex = fetchIndex + 147;
  const additionalNavIndex = navSearchIndex + 5;
  const nav = navData.substring(navSearchIndex, additionalNavIndex);

  // Getting NAV Diff Data
  const differenceSearchIndex = fetchIndex + 205;
  const additionalDiffIndex = differenceSearchIndex + 4;
  const difference = navData.substring(
    differenceSearchIndex,
    additionalDiffIndex
  );

  // Getting NAV Percentage Data
  const differencePerSearchIndex = fetchIndex + 270;
  const additionalDiffPerIndex = differencePerSearchIndex + 5;
  const diffPer = navData.substring(
    differencePerSearchIndex,
    additionalDiffPerIndex
  );
  return { fetchDate: date, nav, difference, diffPercent: diffPer, color };
}
