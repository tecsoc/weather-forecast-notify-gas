//曜日を取得
const getWeekday = () => {
  const weekday = new Date().getDay() - 1;
  if(weekday === -1){
    weekday = 6;
  }
  return weekday;
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