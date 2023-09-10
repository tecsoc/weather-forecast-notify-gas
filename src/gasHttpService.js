const doGet = (e) => {
  const response = {};
  const userId = e.parameter.userId;
  const sheet = new SpreadSheet();
  if (e.parameter.type === 'updateSetting') {
    const result = sheet.setDeliverySettings(userId, e.parameter.settings);
    response.result = result;
  } else {
    const settings = sheet.getDeliverySettings(userId);
    if (settings.length) {
      response.settings = settings;
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
  const [id, name] = getEventSourceInfo(event.source);
  const token = event.replyToken;

  const sheet = new SpreadSheet();
  const lineClient = new LineApiClient();
  
  let payload = {
    replyToken: token,
    messages: []
  };
  if (['follow', 'join'].includes(event.type)) {
    const userName = getUserName(id);
    // 新規ユーザーの場合初期化
    let message = '登録ありがとうございます。デフォルトで毎日天気配信を行います。\n画面下のリッチメニューにある、「天気配信を設定」ボタンから配信曜日を設定できます';;
    if (index === -1) {
      sheet.insertUser(id, userName);
    // 既存ユーザーの場合、論理削除フラグをオンにするだけ
    } else {
      sheet.setLogicalDeleteFlag(userId, 1);
      message = `再${message}`;
    }
    payload = pushTextMessage(payload, message);
  } else if (['unfollow', 'leave'].includes(event.type)) {
    if (index !== -1) {
      // 論理削除フラグをオフにする
      sheet.setLogicalDeleteFlag(userId, 0);
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
    const templeteMessage = 'このアカウントは基本的に返信に対応してないよ。\n「@今日の天気」と送ると、今日の東京の天気が送られてくるよ！！';

    switch(text){
      case '@今日の天気':
        payload = lineClient.createTemplateWeatherForecastMessage(payload, sheet);
        break;
        
      case 'デバッグ':
        payload = lineClient.pushTextMessage(payload,'デバッグお疲れ様です');
        break;
        
      default:
        const message = text.match(/おうむ|オウム/) ? 'オウムじゃないよ？？' : templeteMessage;
        payload = lineClient.pushTextMessage(payload, message);
        break;
    }
  }

  lineClient.reply(payload);
}