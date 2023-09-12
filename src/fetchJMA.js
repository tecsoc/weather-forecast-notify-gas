class fetchJMA {

  constructor () {
    this.namespace = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/body/meteorology1/');
  }

  getXML(url){
    const options = {
      muteHttpExceptions: true
    };
    try{
      const xmlStr = UrlFetchApp.fetch(url, options);
      return XmlService.parse(xmlStr);
    } catch (e) {
      console.error(e);
      throw new Error(`XMLの取得に失敗しました\nエラー内容: \nエラー内容: ${e}`);
    }
  //  return XmlService.parse(UrlFetchApp.fetch(url)).getContentText();
  }

  getWeatherXmlLink(deliveryType = "府県天気予報", author = "気象庁") {
    const xml = this.getXML('https://www.data.jma.go.jp/developer/xml/feed/regular_l.xml');
    // 名前空間の取得
    const atom = XmlService.getNamespace("http://www.w3.org/2005/Atom");
    // entry要素のlistを取得
    const entries = xml.getRootElement().getChildren("entry", atom);
    for (let i = 0; i < entries.length; i++) {
      // タイトルが違ったらcontinue
      if (entries[i].getChildText('title', atom).indexOf(deliveryType) !== -1){
        // 東京かどうか
        if (entries[i].getChild('author', atom).getChildText('name', atom).indexOf(author) !== -1){
          return entries[i].getChild('link', atom).getAttribute('href').getValue();
        }
      }
    }
    return '';
  }


  getRainfallProbability() {
    // 降水確率取得もとのURL
    const rainfallProbabilitySrcUrl = this.getWeatherXmlLink("府県天気予報");
    console.log(`降水確率取得元URL: ${rainfallProbabilitySrcUrl}`);
    if (!rainfallProbabilitySrcUrl) throw new Error("降水確率のURLが取得できませんでした");

    const xml = this.getXML(rainfallProbabilitySrcUrl);

    const timeSeriesInfo = xml.getRootElement().getChild('Body', this.namespace).getChildren('MeteorologicalInfos', this.namespace)[0].getChildren('TimeSeriesInfo', this.namespace).slice(-1)[0];
    
    const timeDefines = timeSeriesInfo.getChild('TimeDefines', this.namespace).getChildren('TimeDefine', this.namespace);
    const items = timeSeriesInfo.getChildren('Item', this.namespace);

    const rainfallProbabilityArray = [];
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

  fetchWeatherOverview() {
    const weatherOverviewSrcUrl = this.getWeatherXmlLink('府県天気概況');
    console.log(`天気概況取得元URL: ${weatherOverviewSrcUrl}`);
    if (!weatherOverviewSrcUrl) throw new Error("天気概況のURLが取得できませんでした");
    const xml = this.getXML(weatherOverviewSrcUrl);
    let weatherOverview = xml.getRootElement().getChild('Body', this.namespace).getChild('Comment', this.namespace).getChildText('Text', this.namespace);
    weatherOverview = weatherOverview.replace(/[ 　]/g, "");
    weatherOverview = weatherOverview.replace(/。伊豆諸島.+。/g, "。");
    weatherOverview = weatherOverview.replace(/\n\【関東甲信地方\】(\S|\s)+/gm, "");
    return weatherOverview;
  }

  getWeeklyWeatherForecast() {
    const weeklyWeathrtForecatSrcUrl = this.getWeatherXmlLink("府県週間天気予報");
    if (!weeklyWeathrtForecatSrcUrl) throw new Error("週間天気予報のURLが取得できませんでした");
    const xml = this.getXML(weeklyWeathrtForecatSrcUrl);
    const timeSeriesInfo = xml.getRootElement().getChild('Body', this.namespace).getChildren('MeteorologicalInfos', this.namespace)[0].getChildren('TimeSeriesInfo', this.namespace).slice(-1)[0];

    const timeDefines = timeSeriesInfo.getChild('TimeDefines', this.namespace).getChildren('TimeDefine', this.namespace);
    const items = timeSeriesInfo.getChildren('Item', this.namespace);
    const targetElements = (items.find(v => v.getChild("Area", this.namespace).getChildText("Code", this.namespace) === "130010")).getChildren();
    const weatherPartElements = (targetElements.find(v => v.getChild("Property", this.namespace).getChildText("Type", this.namespace) === "天気")).getChild("Property", this.namespace).getChild("WeatherPart", this.namespace).getChildren();
    const probabilityOfPrecipitationPartElements = (targetElements.find(v => v.getChild("Property", this.namespace).getChildText("Type", this.namespace) === "降水確率")).getChild("Property", this.namespace).getChild("ProbabilityOfPrecipitationPart", this.namespace).getChildren();
    const reliabilityClassPartElements = (targetElements.find(v => v.getChild("Property", this.namespace).getChildText("Type", this.namespace) === "信頼度")).getChild("Property", this.namespace).getChild("ReliabilityClassPart", this.namespace).getChildren();
    
    // 天気予報を入れる配列
    // ex.) [ [日付, 天気, 降水確率, 信頼度], [日付, 天気, 降水確率, 信頼度], ... ]
    const weatherForecastList = timeDefines.map((item, i) => {
      return [
        item.getChildText('DateTime', this.namespace).replace(/([0-9]{4})-([0-9]{2})-([0-9]{2}).+/m, '$1/$2/$3'),
        weatherPartElements[i].getText(),
        probabilityOfPrecipitationPartElements[i].getText() || "",
        reliabilityClassPartElements[i].getText() || "-",
      ]
    });

    return weatherForecastList;
  }
}