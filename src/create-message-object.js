function getWeatherObject(title){
  var time = ["00時","06時","12時","18時","24時"];
  var color = ["#6486E3","#ffe600","#ffac43","#c30068","#00904a"];
  var parcent = getWeatherInfo();
  for(var i = 0; i < parcent.length; i++) {
    title += "\n" + parcent[i] + "%";
  }
  var json =
  {
    "type": "flex",
    "altText": title,
    "contents": {
      "type": "bubble",
      "size": "micro",
      "header": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": title,
            "color": "#ffffff",
            "align": "center",
            "gravity": "center",
            "size": "md",
            "weight": "bold"
          }
        ],
        "backgroundColor": "#0367D3",
        "spacing": "md",
        "paddingAll": "15px"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": []
      }
    }
  };
  /*b["contents"]["body"]["contents"].push(
    {
      "type": "filler"
    }
  );*/
  
  for (var i = 1; i <= 5; i++) {
    json['contents']['body']['contents'].push(
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "filler"
              },
              {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "filler"
                  }
                ],
                "cornerRadius": "30px",
                "height": "20px",
                "width": "20px",
                "borderColor": color[i - 1],
                "borderWidth": "3px"
              },
              {
                "type": "filler"
              }
            ],
            "flex": 0,
            "height": "30px",
            "width": "22px"
          },
          {
            "type": "text",
            "text": time[i - 1],
            "gravity": "center",
            "flex": 0,
            "size": "lg",
            "weight": "bold"
          }
        ],
        "spacing": "lg",
        "cornerRadius": "30px"
      }
    );
    if (i !== 5){
      json['contents']['body']['contents'].push(
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "filler"
                    }
                  ]
                }
              ],
              "margin": "sm",
              "flex": 0
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "filler",
                      "flex": 1
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "filler"
                        }
                      ],
                      "width": "3px",
                      "backgroundColor": "#B7B7B7",
                      "flex": 1
                    },
                    {
                      "type": "filler",
                      "flex": 1
                    }
                  ],
                  "flex": 1
                }
              ],
              "width": "20px",
              "margin": "none"
            },
            {
              "type": "filler",
              "flex": 1
            },
            {
              "type": "text",
              "text": parcent[i - 1],
              "gravity": "center",
              "size": "lg",
              "color": "#8c8c8c",
              "margin": "none",
              "flex": 3,
              "align": "end"
            },
            {
              "type": "filler",
              "flex": 3
            }
          ],
          "spacing": "lg",
          "height": "30px"
        }
      );
    }
  }
  
  return json;
}


function tt(){
  Logger.log(getWeatherObject('test')["contents"]);
}

function getWeatherInfo(){
  setSheet('降水確率');
  var weather_info = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  Logger.log(weather_info);
  // 降水確率の配列の初期化
  var parcent = Array.apply(null, Array(4)).map(function () {return "-- %" });
  // 今日の日付をyyyy/mm/dd 形式で取得
  var today = Utilities.formatDate( new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
  var parcent_array_count = 0;
  for (var i = weather_info.length - 1; i >= 0; i--){
    if (weather_info[i][0] === today){
      parcent[3 - parcent_array_count] = weather_info[i][2];
      parcent_array_count++;
    }
  }
  Logger.log(parcent)
  return parcent;
}
