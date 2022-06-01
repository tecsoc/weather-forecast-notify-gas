function myFunction() {
  //getDataFromLine('https://api.line.me/v2/bot/richmenu/list');
  getCurl('https://api.line.me/v2/bot/richmenu/list');
  Logger.log(PropertiesService.getScriptProperties().getProperty('accessToken'));
}

function getCurl(url){
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var headers = {
    'Authorization': 'Bearer ' + access_token
  };
  var options = {
    'method': 'get',
    'headers': headers,
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response);
}

function postCurl(url, headers, data){
  var options = {
    'method': 'post',
    'headers': headers,
    'payload': data
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response);
}

function createRichMenu(json_data){
  var url = 'https://api.line.me/v2/bot/richmenu';
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  json_data = returnRichMenuObject();
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + access_token,
  };
  postCurl(url, headers, JSON.stringify(json_data));
}
/*
function setImageOfRichMenu(image_url){
  var url = 'https://api.line.me/v2/bot/richmenu/richmenu-9e21e28131d5edfc321f93e0eb9d2ef2/content';
  image_url = 'https://drive.google.com/file/d/1hUklvormhXfEOrib2v5y0Yl0mhtdZp05/';
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var headers = {
    'Content-Type': 'image/png',
    'Authorization': 'Bearer ' + access_token,
  };
  postCurl(url, headers, {"file": UrlFetchApp.fetch(image_url).getBlob()});
}
*/
function setRichMenu(menu_id){
  menu_id = 'richmenu-f833fcbc3ca59b3373c09aa59ebd4ca1';
  var url = 'https://api.line.me/v2/bot/user/all/richmenu/' + menu_id;
  var access_token = PropertiesService.getScriptProperties().getProperty('accessToken');
  var headers = {
    'Authorization': 'Bearer ' + access_token,
  };
  postCurl(url, headers);
}


function returnRichMenuObject(){
  var width = 2500;
  var height = 864;
  return {
    'size': {
        'width': width,
        'height': height
    },
    'selected': true,
    'name':'メニュー',
    'chatBarText': 'メニュー',
    'areas': [
      {
        'bounds':{
          'x': 0,
          'y': 0,
          'width': width / 2 - 1,
          'height': height 
        },
        'action':{
          'type': 'message',
          'text': '@今日の降水確率'
        }
       },
      {
        'bounds':{
          'x': width / 2,
          'y': 0,
          'width': width,
          'height': height
        },
        'action':{
          'type': 'uri',
          'uri': 'line://app/1582624460-A8R9a3L8'
        }
      }
    ]
  };
}