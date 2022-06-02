var spreadsheet;
var sheet;

function getWeather(){
  // XMLをパース
  var target_link = getWeatherLink('府県天気予報（Ｒ１）');
  Logger.log(target_link);
  var xml = getXML(target_link);
  // 名前空間を設定
  var namespace = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/body/meteorology1/');
  var TimeSeriesInfo = xml.getRootElement().getChild('Body', namespace).getChildren('MeteorologicalInfos', namespace)[0].getChildren('TimeSeriesInfo', namespace)[1];
  var TimeDefines = TimeSeriesInfo.getChild('TimeDefines', namespace).getChildren('TimeDefine', namespace);
  var items = TimeSeriesInfo.getChildren('Item', namespace);
  // 降水確率が入ってる配列
  var weatherArray = [];
  // 降水確率が入ってる要素の配列
  var target_elements;
  for(var i = 0; i < items.length; i++) {
    if (items[i].getChild('Area', namespace).getChildText('Code', namespace) === '130010'){
      target_elements = items[i].getChild('Kind', namespace).getChild('Property', namespace).getChild('ProbabilityOfPrecipitationPart', namespace).getChildren();
      break;
    }
  }
  for (var i = 0; i < target_elements.length; i++) {
    // [yyyy/mm/dd, tt時からtt時まで, nn%] という形で配列に詰める
    weatherArray.push(
      [
        // yyyy/mm/dd 形式に置換
        TimeDefines[i].getChildText('DateTime', namespace).replace(/([0-9]{4})-([0-9]{2})-([0-9]{2}).+/m, '$1/$2/$3'),
        // tt時からtt時まで
        TimeDefines[i].getChildText('Name', namespace).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
          // 正規表現で全角を半角に変換
          return String.fromCharCode(s.charCodeAt(0) - 65248);
        }),
        // 降水確率
        target_elements[i].getText() + "%"
      ]
    );
  }
  Logger.log(weatherArray);
  //.replace(/\s+/g, "");
  setSheet('降水確率');
  // 値があるセルをクリアする
  sheet.clearContents();
  // スプレッドシートに書き込む
  sheet.getRange(1, 1, weatherArray.length, weatherArray[0].length).setValues(weatherArray);
  
  target_link = getWeatherLink('府県天気概況');
  Logger.log(target_link);
  xml = getXML(target_link);
  var weather_overview = xml.getRootElement().getChild('Body', namespace).getChild('Comment', namespace).getChildText('Text', namespace);
  weather_overview = weather_overview.replace(/ |　|^\n/gm, "");
  weather_overview = weather_overview.replace(/。伊豆諸島.+。/g, "。");
  weather_overview = weather_overview.replace(/\n\【関東甲信地方\】(\S|\s)+/gm, "");
  setSheet('天気概況');
  sheet.getRange(1, 1).setValue(weather_overview);
}

function getXML(url){
  var options = {
    muteHttpExceptions:true
  };
  var xml_str = UrlFetchApp.fetch(url, options);
  return XmlService.parse(xml_str);
//  return XmlService.parse(UrlFetchApp.fetch(url)).getContentText();
}

// 府県天気予報
function getWeatherForecastLink(place){
  if (!place) place = '東京';
  var xml = getXML('https://www.data.jma.go.jp/developer/xml/feed/regular.xml');
  // 名前空間の取得
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  // entry要素のlistを取得
  var entries = xml.getRootElement().getChildren("entry", atom);
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].getChildText('title', atom) === '府県天気予報（Ｒ１）') {
      if (entries[i].getChildText('content', atom).indexOf(place) != -1) {
        return entries[i].getChild('link', atom).getAttribute('href').getValue();
      }
    }
  }
}

// 府県天気予報
function getWeatherLink(type, place){
  if (!place) place = '気象庁';
  var xml = getXML('https://www.data.jma.go.jp/developer/xml/feed/regular_l.xml');
  // 名前空間の取得
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  // entry要素のlistを取得
  var entries = xml.getRootElement().getChildren("entry", atom);
  for (var i = 0; i < entries.length; i++) {
    // タイトルが違ったらcontinue
    if (entries[i].getChildText('title', atom) === type){
      // 東京かどうか
      if (entries[i].getChild('author', atom).getChildText('name', atom).indexOf(place) !== -1){
        return entries[i].getChild('link', atom).getAttribute('href').getValue();
      }
    }
    /*if (entries[i].getChildText('title', atom) === type) {
      if (type === '府県天気予報'){
        if (entries[i].getChildText('content', atom).indexOf(place) != -1) {
          return entries[i].getChild('link', atom).getAttribute('href').getValue();
        }
      } else{
        if ()
      }
    }*/
  }
}


function setSheet(sheet_name){
  var sheet_id = "1Z2pynN7cWB0CAawy8e_qZkIlJ7WqPE1Voi0hBvWCELA"

  // シートの取得
  spreadsheet = SpreadsheetApp.openById(sheet_id);
  sheet = spreadsheet.getSheetByName(sheet_name);
}

function getWeatherOverview(){
  setSheet('天気概況');
  return sheet.getRange(1, 1).getValue();
}
