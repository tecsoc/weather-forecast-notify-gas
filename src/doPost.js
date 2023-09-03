function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  
  if (json.type === 'updateSetting') {
    const response = setSetting(json.userId, json.settings);
    return returnJson({ result: response });
  }

  const event = json.events[0];
  const userId = event.source.userId;
  var token = event.replyToken;
  // 送信されてきたテキストを取り出し
  var text = event.message.text;
  // テンプレ返信メッセージ
  const templete = 'このアカウントは基本的に返信に対応してないよ。\n「@今日の天気」と送ると、今日の東京の天気が送られてくるよ！！';
  
  /*if (event.type = 'follow'){
  var message = [{
  'type' : 'text',
  'text' : '今日の東京の降水確率'
  }];
  reply(headers, token, message)
  return 0;
  }*/
  
  if (text.match(/@詳細設定\n(.+)/)){
    var setting = text.replace(/@詳細設定\n(.+)/,'$1');
    setting = setting.split(',');
    var range　= sheet.getRange(3, 2, sheet.getLastRow() - 2).getValues();
    var targetRow = -1;
    for(var i = 0; i < range.length; i++){
      if(range[i].indexOf(userId) != -1){
        targetRow = i + 3;
        break;
      }
    }
    if(targetRow != -1){
      var arr = [setting];
      sheet.getRange(targetRow,5,1,8).setValues(arr);
      text = '@詳細設定完了';
    }else{
      text = 'エラーです';
    }
  }
  var data = createEmptyData(token);
  switch(text){
    case '@今日の天気':
      /*data = pushTextMessage(data,'今日の東京の降水確率');
      data = pushTextMessage(data,readData(1));
      data = pushTextMessage(data,readData(2));*/
      data = createWeatherMessageData(data);
      break;
      
    case 'はげ':
      data = pushTextMessage(data,'ようハゲ！');
      break;
      
    case 'よう':
      data = pushTextMessage(data,'おっす！');
      break;
      
    case '@天気配信を設定':
      setSheet('天気配信管理');
      var message = '';
      if(searchRow(sheet,2,userId) == -1){
        message = '天気配信を設定しました。\n毎日5時から6時に送信します。';
        sheet.getRange(sheet.getLastRow() + 1,2).setValue(userId);
        sheet.getRange(sheet.getLastRow(),3).setValue(getUserName(userId));
      }else{
        message = '天気配信は既に設定されています。\n毎日5時から6時の間に送信します。';
      }
      data = pushTextMessage(data,message);
      break;
      
    case '@天気配信を解除':
      setSheet('天気配信管理');
      var message = '';
      var column = searchRow(sheet,2,userId);
      if(column != -1){
        sheet.deleteRow(column);
        message = '天気配信を設定解除しました';
      }else{
        message = '天気配信がまだ設定されていません\n「@天気配信を設定」と送ると設定できます。';
      }
      data = pushTextMessage(data,message);
      break;
      
    case '@詳細設定完了':
      data = pushTextMessage(data,'設定完了！');
      break;
      
    case 'エラーです':
      data = pushTextMessage(data,'エラーです');
      break;
    case 'デバッグ':
      data = pushTextMessage(data,'デバッグ1中です！！');
      break;
      
    default:
      if (text.match(/おうむ|オウム/)){
        data = pushTextMessage(data,'オウムじゃないよ？？');
      } else {
        data = pushTextMessage(data,templete);
        break;
      }
  }
  reply(data);
}

function reply(data){
  var secret = 'Bearer ' + PropertiesService.getScriptProperties().getProperty('accessToken');
  
  // リプライを返すAPIのURI
  var url = 'https://api.line.me/v2/bot/message/reply';
  
  //HTTPヘッダーの設定
  var headers = {
    'Content-Type' : 'application/json',
    'Authorization': secret
  };
  
  var options = {
    'method' : 'POST',
    'headers' : headers,
    'payload' : JSON.stringify(data)
  };
  
  return UrlFetchApp.fetch(url, options);
};

function createEmptyData(token){
  return {
    'replyToken' : token,
    'messages' : []
  };
}

function createWeatherMessageData(data){
  data.messages.push(getWeatherObject("今日の東京の天気"));
  data = pushTextMessage(data, getWeatherOverview());
  data = pushTextMessage(data, getWeeklyWeather());
  return data;
}

function pushTextMessage(data,message){
  data.messages.push({
    'type': 'text',
    'text': message
  });
  return data;
}

function Test(){
  const token = '#000000'
  var data = createEmptyData(token);
  data = pushTextMessage(data,'テストーー！！');
  Logger.log(data);
}