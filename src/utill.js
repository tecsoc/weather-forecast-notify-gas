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
  const weekdayStr = "日月火水木金土";
  return weekdayStr[dayObject.getDay()];
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