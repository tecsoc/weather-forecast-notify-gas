/*
function pushMessage(USER_ID) {
  //deleteTrigger();
  
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var postData = {
    'to': USER_ID,
    'messages' : []
  };
  postData = pushTextMessage(postData, '今日の東京の降水確率');
  postData = pushTextMessage(postData, readData(1));
  postData = pushTextMessage(postData, readData(2));

  var url = 'https://api.line.me/v2/bot/message/push';
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + access_token,
  };

  var options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
}
*/

function pushMessage(USER_ID) {
  //deleteTrigger();
  
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var postData = {
    'to': USER_ID,
    'messages' : []
  };
  
  postData.messages.push(getWeatherObject("今日の東京の天気"));

  var url = 'https://api.line.me/v2/bot/message/push';
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + access_token,
  };

  var options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
}

function pushMessageAll(){
  var userList = getPushUserList();
  if(userList === null){
    return; 
  }
  
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var postData = {
    "to": userList,
    "messages" : []
  };
  postData = createWeatherMessageData(postData);

  var url = "https://api.line.me/v2/bot/message/multicast";
  var headers = {
    "Content-Type": "application/json",
    'Authorization': 'Bearer ' + access_token,
  };

  var options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response);
}

function getPushUserList(){
  setSheet("天気配信管理");
  // 送信するユーザーリスト
  var userList = [];
  // 天気配信管理スプシからデータを取得
  var database = sheet.getRange(3, 2, sheet.getLastRow() - 2, sheet.getLastColumn() - 1).getValues();
  // Logger.log(database);
  // キーとなる曜日のindex
  var weekday_index = 3;
  if(isHoliday()){
    weekday_index += 7;
  }else{
    weekday_index += getWeekday();
  }
  for (var i = 0; i < database.length; i++){
    if (!database[i][2]) continue;
    if (database[i][weekday_index]){
      userList.push(database[i][0]);
    }
  }
  Logger.log(userList);
  return userList;
}