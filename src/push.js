
function pushMessage(userId) {
  //deleteTrigger();
  
  const accessToken = PropertiesService.getScriptProperties().getProperty('accessToken');
  const payload = {
    to: userId,
    messages: []
  };
  pushLichRainfallProbabilityMessage(payload, "今日の東京の天気")

  var url = 'https://api.line.me/v2/bot/message/push';
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + accessToken,
  };

  var options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(url, options);
  console.log(response);
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
  postData = createWeatherMessages(postData);

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
  console.log(response);
}