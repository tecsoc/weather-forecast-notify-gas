//曜日を取得
const getWeekday = () => {
  const weekday = new Date().getDay() - 1;
  return weekday === -1 ? 6 : weekday;
}

//祝日か判定
const isHoliday = () => {
  const today = new Date();
  
  const calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  const calendar = CalendarApp.getCalendarById(calendarId);
  const todayEvents = calendar.getEventsForDay(today);
  const returnValue = todayEvents.length > 0;
  return returnValue;
}

const getWeekdayStr = (dayObject) => {
  const weekdayArray = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdayArray[dayObject.getDay()];
}

const resetSpreadSheetEditLoack = () => {
  const sheet = new SpreadSheet();
  sheet.releaseEditLock();
}

const getTodayTargetUserList = () => {
  const sheet = new SpreadSheet();
  const targetUserList = sheet.getPushTargetUserList();
  console.log(`送信対象ユーザーIDリスト: ${targetUserList}`);
};

const dateToYYYYMMDD = (date) => {
  const dateFormat = Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return dateFormat.format(date);
}

const dateToHH = (date) => {
  const dateFormat = Intl.DateTimeFormat('es-ES', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit'
  });
  return dateFormat.format(date);
}