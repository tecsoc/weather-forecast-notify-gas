class LineApiClient {
  constructor() {
    this.lineBaseEndpoint = 'https://api.line.me/v2/bot';
    this.secret = `Bearer ${PropertiesService.getScriptProperties().getProperty('accessToken')}`;
  }

  getJsonFromResponse(response) {
    return JSON.parse(response.getContentText());
  }

  getFetch(path) {
    const requestUrl = this.lineBaseEndpoint + path;
    const options = {
      headers: {
        Authorization: this.secret
      },
      muteHttpExceptions: true
    };
    try {
      const response = UrlFetchApp.fetch(requestUrl, options);
      return this.getJsonFromResponse(response);
    } catch (e) {
      console.error(e);
      throw new Error(`LINEからの取得に失敗しました\nエラー内容: ${e}`);
    }
  }

  getUserName(userId) {
    const path = `/profile/${userId}`;
    const json = this.getFetch(path);
    return json.displayName;
  }

  getGroupName(groupId) {
    const path = `/group/${groupId}/summary`;
    const json = this.getFetch(path);
    return json.groupName;
  }


  getRoomMemberNames(roomId, memberIds) { 
    const path = `/room/${roomId}/members/`;
    const names = memberIds.map((userId) => {
      const requestPath = path + userId;
      const json = this.getFetch(requestPath);
      return json.displayName;
    });
    return names;
  }

  getRoomMemberIds(roomId) {
    const path = `/room/${roomId}/members/ids`;
    const json = this.getFetch(path);
    return json.memberIds;
  }

  getRoomMemberName(roomId) {
    const memberIds = this.getRoomMemberIds(roomId);
    const names = this.getRoomMemberNames(roomId, memberIds);
    const roomName = names.join(', ');
    return roomName;
  }

  getEventSourceInfo(source) {
    if (source.type === 'room') {
      const roomId = source.roomId;
      const roomName = this.getRoomMemberName(roomId);
      return [roomId, roomName];
    } else if (source.type === 'group') {
      const groupId = source.groupId;
      const groupName = this.getGroupName(groupId);
      return [groupId, groupName];
    } else {
      const userId = source.userId;
      const userName = this.getUserName(userId);
      return [userId, userName];
    }
  }

  pushTextMessage(payload, text) {
    const message = {
      type: 'text',
      text: text
    };
    payload.messages.push(message);
    return payload;
  }

  createTemplateWeatherForecastMessage(payload, sheet) {
    const weatherOverview = sheet.getWeatherOverview();
    const rainfallProbabilityPercentList = sheet.getRainfallProbabilityPercentList();
    const weeklyWeatherForecastList = sheet.getWeeklyWeatherForecast();

    console.log(`天気概況:\n\n${weatherOverview}`);
    console.log(`\n\n降水確率:\n${rainfallProbabilityPercentList}`);
    console.log(`\n週間天気予報:\n${weeklyWeatherForecastList}`);

    payload = this.pushTextMessage(payload, weatherOverview);
    payload = this.pushLichRainfallProbabilityMessage(payload, "今日の東京の天気", rainfallProbabilityPercentList)
    payload = this.pushLichWeeklyWeatherForecastMessage(payload, "週間天気予報", weeklyWeatherForecastList);
    return payload;
  }

  createSendMessagesData(to, messages) {
    return {
      to,
      messages
    };
  }

  postFetch(path, payload) {
    const requestUrl = this.lineBaseEndpoint + path;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': this.secret
    };
    const options = {
      method: 'post',
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    try {
      const response = UrlFetchApp.fetch(requestUrl, options);
      return this.getJsonFromResponse(response);
    } catch (e) {
      console.error(e);
      throw new Error(`LINEへの送信に失敗しました\nエラー内容: ${e}`);
    }
  }

  reply(payload) {
    return this.postFetch('/message/reply', payload);
  }

  pushMessage(payload) {
    return this.postFetch('/message/push', payload);
  }

  pushMulticastMessage(payload) {
    return this.postFetch('/message/multicast', payload);
  }

  // 週間天気予報のリッチメッセージを追加する
  pushLichWeeklyWeatherForecastMessage(payload, title, weeklyWeatherForecast){
    const altText = weeklyWeatherForecast.map((row) => row.join(" ")).join("\n");
    const separatorWidth = 2;
    const marginItem = {
      "type": "box",
      "layout": "vertical",
      "contents": [],
      "flex": 0
    };
    const flexFactorList = [45, 75, 24, 12]
    const messageContents = weeklyWeatherForecast.reduce((prev, row, i) => {
      const mainContents = row.map((item) => {
        const obj = {
          "type": "text",
          "text": item,
          "flex": flexFactorList[i],
          "align": "center",
          "wrap": false
        };
        return obj;
      });
      const contentsWithSeparator = mainContents.reduce((prev, current) => {
        const obj = {
          "type": "box",
          "layout": "vertical",
          "contents": [],
          "backgroundColor": "#55534760",
          "flex": separatorWidth
        };
        return [...prev, obj, current];
      }, [mainContents[0]]);

      const contents = [
        ...marginItem,
        ...contentsWithSeparator,
        ...marginItem
      ];

      const currentValue = {
        "type": "box",
        "layout": "horizontal",
        "contents": contents,
        "spacing": "sm"
      };
      
      const result = {
        ...prev,
        ...currentValue
      };
      return result;
    }, {});

    const json = {
      "type": "flex",
      "altText": altText,
      "contents": {
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": title,
              "offsetEnd": "sm",
              "weight": "bold",
              "size": "lg"
            },
            ...messageContents,
          ],
          "justifyContent": "center",
          "alignItems": "center",
          "spacing": "md",
          "paddingTop": "md",
          "paddingBottom": "md",
          "paddingStart": "sm",
          "paddingEnd": "sm"
        }
      }
    };

    payload.messages.push(json);
    return payload;
  }

  pushLichRainfallProbabilityMessage(payload, title, rainfallProbabilityPercentList) {
    const time = ["00時","06時","12時","18時","24時"];
    const color = ["#6486E3","#ffe600","#ffac43","#c30068","#00904a"];
    const altText = [title, ...rainfallProbabilityPercentList].join("\n");
  
    const json = {
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
    
    for (let i = 1; i <= 5; i++) {
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
}