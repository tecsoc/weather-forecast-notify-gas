let spreadsheet;
let sheet;

class GetWeather {

  constructor () {
    this.namespace = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/body/meteorology1/');
  }

  getXML(url){
    let options = {
      muteHttpExceptions: true
    };
    let xmlStr = UrlFetchApp.fetch(url, options);
    return XmlService.parse(xmlStr);
  //  return XmlService.parse(UrlFetchApp.fetch(url)).getContentText();
  }

  getWeatherXmlLink(deliveryType = "府県天気予報", author = "気象庁") {
    let xml = this.getXML('https://www.data.jma.go.jp/developer/xml/feed/regular_l.xml');
    // 名前空間の取得
    let atom = XmlService.getNamespace("http://www.w3.org/2005/Atom");
    // entry要素のlistを取得
    let entries = xml.getRootElement().getChildren("entry", atom);
    for (let i = 0; i < entries.length; i++) {
      // タイトルが違ったらcontinue
      if (entries[i].getChildText('title', atom).indexOf(deliveryType) !== -1){
        // 東京かどうか
        if (entries[i].getChild('author', atom).getChildText('name', atom).indexOf(author) !== -1){
          return entries[i].getChild('link', atom).getAttribute('href').getValue();
        }
      }
    }
  }


  getRainfallProbability() {

    let targetLink = this.getWeatherXmlLink("府県天気予報");
    Logger.log(targetLink);

    let xml = this.getXML(targetLink);

    let timeSeriesInfo = xml.getRootElement().getChild('Body', this.namespace).getChildren('MeteorologicalInfos', this.namespace)[0].getChildren('TimeSeriesInfo', this.namespace).slice(-1)[0];
    
    let timeDefines = timeSeriesInfo.getChild('TimeDefines', this.namespace).getChildren('TimeDefine', this.namespace);
    let items = timeSeriesInfo.getChildren('Item', this.namespace);

    let rainfallProbabilityArray = [];
    // 降水確率が入ってる要素の配列
    let elementsInRainfallProbability;
    for(let i = 0; items.length; i++) {
      if (items[i].getChild("Area", this.namespace).getChildText("Code", this.namespace) === "130010"){
        elementsInRainfallProbability = items[i].getChild("Kind", this.namespace).getChild("Property", this.namespace).getChild("ProbabilityOfPrecipitationPart", this.namespace).getChildren();
        break;
      }
    }
    for (let i = 0; i < elementsInRainfallProbability.length; i++) {
      // [yyyy/mm/dd, tt時からtt時まで, nn%] という形で配列に詰める
      rainfallProbabilityArray.push(
        [
          // yyyy/mm/dd 形式に置換
          timeDefines[i].getChildText('DateTime', this.namespace).replace(/([0-9]{4})-([0-9]{2})-([0-9]{2}).+/m, '$1/$2/$3'),
          // tt時からtt時まで
          timeDefines[i].getChildText('Name', this.namespace).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
            // 正規表現で全角を半角に変換
            return String.fromCharCode(s.charCodeAt(0) - 65248);
          }),
          // 降水確率
          elementsInRainfallProbability[i].getText() + "%"
        ]
      );
    }
    return rainfallProbabilityArray;
  }

  getWeatherOverview() {
    let targetLink = this.getWeatherXmlLink('府県天気概況');
    Logger.log(targetLink);
    let xml = this.getXML(targetLink);
    let weatherOverview = xml.getRootElement().getChild('Body', this.namespace).getChild('Comment', this.namespace).getChildText('Text', this.namespace);
    weatherOverview = weatherOverview.replace(/ |　|^\n/gm, "");
    weatherOverview = weatherOverview.replace(/。伊豆諸島.+。/g, "。");
    weatherOverview = weatherOverview.replace(/\n\【関東甲信地方\】(\S|\s)+/gm, "");
    return weatherOverview;
  }

  setWeatherOverviewToSheet(str) {
    setSheet('天気概況');
    sheet.getRange(1, 1).setValue(str);
  }

  setRainfallProbabilityToSheet(rainfallProbabilityArray) {
    setSheet('降水確率');
    // 値があるセルをクリアする
    sheet.clearContents();
    // スプレッドシートに書き込む
    sheet.getRange(1, 1, rainfallProbabilityArray.length, rainfallProbabilityArray[0].length).setValues(rainfallProbabilityArray);
  }

  getWeeklyWeatherForecast() {
    let targetLink = this.getWeatherXmlLink("府県週間天気予報");
    Logger.log(targetLink);
    let xml = this.getXML(targetLink);
    let timeSeriesInfo = xml.getRootElement().getChild('Body', this.namespace).getChildren('MeteorologicalInfos', this.namespace)[0].getChildren('TimeSeriesInfo', this.namespace).slice(-1)[0];

    let timeDefines = timeSeriesInfo.getChild('TimeDefines', this.namespace).getChildren('TimeDefine', this.namespace);
    let items = timeSeriesInfo.getChildren('Item', this.namespace);
    let targetElements = (items.find(v => v.getChild("Area", this.namespace).getChildText("Code", this.namespace) === "130010")).getChildren();
    let weatherPartElements = (targetElements.find(v => v.getChild("Property", this.namespace).getChildText("Type", this.namespace) === "天気")).getChild("Property", this.namespace).getChild("WeatherPart", this.namespace).getChildren();
    let probabilityOfPrecipitationPartElements = (targetElements.find(v => v.getChild("Property", this.namespace).getChildText("Type", this.namespace) === "降水確率")).getChild("Property", this.namespace).getChild("ProbabilityOfPrecipitationPart", this.namespace).getChildren();
    let reliabilityClassPartElements = (targetElements.find(v => v.getChild("Property", this.namespace).getChildText("Type", this.namespace) === "信頼度")).getChild("Property", this.namespace).getChild("ReliabilityClassPart", this.namespace).getChildren();
    
    // 天気予報を入れる配列
    let arrayInWeatherForecast = [];
    for(let i = 0; i < timeDefines.length; i++) {
      arrayInWeatherForecast.push(
        [
          timeDefines[i].getChildText('DateTime', this.namespace).replace(/([0-9]{4})-([0-9]{2})-([0-9]{2}).+/m, '$1/$2/$3'),
          weatherPartElements[i].getText(),
          probabilityOfPrecipitationPartElements[i].getText() ? probabilityOfPrecipitationPartElements[i].getText() : "--",
          reliabilityClassPartElements[i].getText() ? reliabilityClassPartElements[i].getText() : "-",
        ]
      );
    }
    return arrayInWeatherForecast;
  }

  setWeeklyWeatherForecastToSheet(weeklyWeatherForecastArray){
    setSheet('週間天気予報');
    // 値があるセルをクリアする
    sheet.clearContents();
    // スプレッドシートに書き込む
    sheet.getRange(1, 1, weeklyWeatherForecastArray.length, weeklyWeatherForecastArray[0].length).setValues(weeklyWeatherForecastArray);
  }
}

function getWeatherWeekly(){
  let GetWeatherHandler = new GetWeather();
  let weeklyWeatherForecastArray = GetWeatherHandler.getWeeklyWeatherForecast();
  Logger.log(weeklyWeatherForecastArray);
  GetWeatherHandler.setWeeklyWeatherForecastToSheet(weeklyWeatherForecastArray);
}


function getWeather(){
  let GetWeatherHandler = new GetWeather();
  let rainfallProbabilityArray = GetWeatherHandler.getRainfallProbability();
  Logger.log(rainfallProbabilityArray);
  GetWeatherHandler.setRainfallProbabilityToSheet(rainfallProbabilityArray);
  let weatherOverview = GetWeatherHandler.getWeatherOverview();
  Logger.log(weatherOverview);
  GetWeatherHandler.setWeatherOverviewToSheet(weatherOverview);
  getWeatherWeekly();
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

function getWeeklyWeather() {
  setSheet("週間天気予報");
  let weeklyWeatherArray = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  let messageStr = "";
  let weekdayArray = "日月火水木金土";
  let dateObject = new Date(); // 今日の日付で初期化
  for(let i = 0; i < weeklyWeatherArray.length; i++) {
    dateObject.setDate(dateObject.getDate() + 1); // 次の日にする
    weeklyWeatherArray[i][0] = weeklyWeatherArray[i][0].replace(/[0-9]{4}\//,"");
    weeklyWeatherArray[i][0] += `(${weekdayArray[dateObject.getDay()]})`;
    weeklyWeatherArray[i][2] += "%";
    messageStr += weeklyWeatherArray[i].join(" ");
    if (i !== weeklyWeatherArray.length - 1) messageStr += "\n";
  }
  return messageStr;
}