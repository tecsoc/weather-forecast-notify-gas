function pushLichRainfallProbabilityMessage(payload, title, rainfallProbabilityPercentList){
  const time = ["00時","06時","12時","18時","24時"];
  const color = ["#6486E3","#ffe600","#ffac43","#c30068","#00904a"];
  const altText = [title, ...rainfallProbabilityPercentList].join("\n");

  const json =
  {
    "type": "flex",
    "altText": altText,
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
            "width": "22px",
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
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "filler",
                      "flex": 4,
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [],
                      "backgroundColor": "#B7B7B7",
                      "flex": 2,
                    },
                    {
                      "type": "filler",
                      "flex": 5
                    }
                  ],
                  "flex": 1,
                  "width": "22px"
                }
              ],
              "flex": 1,
              "margin": "none"
            },
            {
              "type": "filler",
              "flex": 1
            },
            {
              "type": "text",
              "text": rainfallProbabilityPercentList[i - 1],
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
  
  payload.messages.push(json);
  return payload;
}
