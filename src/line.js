function morning(){
  getWeather();
  pushMessageAll();
}


function pushOwn() {
  pushMessage('Uc3ce448a6a7c68da0b4564bde5745fad');
}

function getUserName(userId) {
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var url = 'https://api.line.me/v2/bot/profile/' + userId;
  var response = UrlFetchApp.fetch(url, {
    'headers': {
      'Authorization': 'Bearer ' + access_token
    }
  });
  return JSON.parse(response.getContentText()).displayName;
}



function searchRow(sheet,column,value){
  var array = sheet.getRange(1,column,sheet.getLastRow()).getValues();
 
  var _ = Underscore.load();
  var arrTrans = _.zip.apply(_, array);
  num = arrTrans[0].indexOf(value);
  if(num != -1){
    num += 1;
  }
  return num;
}


//曜日を取得
function getWeekday(){
  var weekday = new Date().getDay() - 1;
  /*var weekday = new Date();
  weekday.setDate(weekday.getDate() + 7);
  weekday = weekday.getDay() - 1;*/
  if(weekday === -1){
    weekday = 6;
  }
  return weekday;
}

//祝日か判定
function isHoliday(){
  var today = new Date();
  //today.setDate(today.getDate() + 17);
  
  var calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  var calendar = CalendarApp.getCalendarById(calendarId);
  var todayEvents = calendar.getEventsForDay(today);
  if(todayEvents.length > 0){
    return true;
  }else{
    return false;
  }
}