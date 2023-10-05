const doGet = (e) => {
  const response = {};
  const userId = e.parameter.userId;
  const sheet = new SpreadSheet();
  if (e.parameter.type === 'updateSetting') {
    response.result = sheet.setDeliverySettings(userId, e.parameters.settings, e.parameter.baseRainfallProbability);
  } else {
    const settings = sheet.getDeliverySettings(userId);
    const baseRainfallProbability = sheet.getBaseRainfallProbability(userId);
    if (settings.length) {
      response.settings = settings;
      response.baseRainfallProbability = baseRainfallProbability;
    } else {
      response.error = `Not Found User: ${userId}`;
    }
  }
  const json = JSON.stringify(response);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

const doPost = (e) => {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];
  const lineClient = new LineApiClient();
  const [id, name] = lineClient.getEventSourceInfo(event.source);
  const token = event.replyToken;

  const sheet = new SpreadSheet();
  
  const userIndex = sheet.getUserIndex(id);

  let payload = {
    replyToken: token,
    messages: []
  };

  if (['follow', 'join'].includes(event.type)) {
    // 新規ユーザーの場合初期化
    let message = '登録ありがとうございます。\nデフォルトで毎日天気配信を行います。\n画面下のメニューの左にある「天気配信を設定」ボタンから配信曜日を設定できます。\n同じメニューの右には「今日の天気」ボタンがあり、任意のタイミングで今日の天気を取得できます。';;
    if (userIndex === 0) {
      sheet.insertUser(id, name);
    // 既存ユーザーの場合、論理削除フラグをオンにするだけ
    } else {
      sheet.setLogicalDeleteFlag(id, 1);
      message = `再${message}`;
    }
    payload = lineClient.pushTextMessage(payload, message);
  } else if (['unfollow', 'leave'].includes(event.type)) {
    if (userIndex !== 0) {
      // 論理削除フラグをオフにする
      sheet.setLogicalDeleteFlag(id, 0);
    }
    return;
  } else if (['memberJoined', 'memberLeft'].includes(event.type) && event.source.type === 'room') {
    // roomの場合参加メンバーの情報がルーム名になるので、ルーム名を更新する
    sheet.setUserName(id, name);
    return;
  } else if (event.type === 'message') {
    // 送信されてきたテキストを取り出し
    const text = event.message.text;
    // テンプレ返信メッセージ
    const templateMessage = 'このアカウントは基本的に返信に対応してないよ。\n「@今日の天気」と送ると今日の東京の天気が、「@24時間天気」と送ると24時間の天気予報が送られてくるよ！！';

    let args;
    switch(text){
      case '@今日の天気':
        payload = lineClient.createTemplateWeatherForecastMessage(payload, sheet, true);
        break;
      case '@24時間天気':
        payload = lineClient.createTemplateWeatherForecastMessage(payload, sheet, false);
        break;
      case 'デバッグ':
        payload = lineClient.pushTextMessage(payload,'デバッグお疲れ様です');
        break;
        
      default:
        const message = text.match(/おうむ|オウム/) ? 'オウムじゃないよ？？' : templateMessage;
        payload = lineClient.pushTextMessage(payload, message);
        break;
    }
  }
  lineClient.reply(payload);
}