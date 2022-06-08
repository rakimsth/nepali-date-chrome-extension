document.addEventListener("DOMContentLoaded", () => {
  const dialogBox = document.getElementById("dialog-box");
  const query = { active: true, currentWindow: true };

  chrome.tabs.query(query, (tabs) => {
    const today = getNepToday();
    dialogBox.innerHTML = getConvertedDate(today);
  });
});

const getConvertedDate = (today) => {
  return `<h1>${today.nepDate}</h1>` + `${today.engDate}`;
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
