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

  createTemplateWeatherForecastMessage(payload, sheet, onlyToday) {
    const rainfallProbabilityPercents = sheet.getRainfallProbabilityPercents(onlyToday);
    const weeklyWeatherForecastList = sheet.getWeeklyWeatherForecast();
    const weatherOverview = sheet.getWeatherOverview();

    console.log(`降水確率:\n${rainfallProbabilityPercents}`);
    console.log(`週間天気予報:\n${weeklyWeatherForecastList}`);
    console.log(`天気概況:\n${weatherOverview}`);

    payload = this.pushRichRainfallProbabilityMessage(payload, "今日の東京の天気", rainfallProbabilityPercents)
    payload = this.pushLichWeeklyWeatherForecastMessage(payload, "週間天気予報", weeklyWeatherForecastList);
    payload = this.pushTextMessage(payload, weatherOverview);
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

  joinSeparator(list, separator) {
    if (list.length === 0) return [];
    return list.slice(1).reduce((prev, current) => {
      return [...prev, separator, current];
    }, [list[0]]);
  }

  insertStartAndEnd(list,  firstItem, lastItem=firstItem) {
    return [firstItem, ...list, lastItem];
  }

  // 週間天気予報のリッチメッセージを追加する
  pushLichWeeklyWeatherForecastMessage(payload, title, weeklyWeatherForecast){
    const altText = weeklyWeatherForecast.map((row) => row.join(" ")).join("\n");
    const separatorWidth = 2;
    const separator = {
      "type": "box",
      "layout": "vertical",
      "contents": [],
      "backgroundColor": "#B75D69",
      "flex": separatorWidth
    };
    const marginItem = {
      "type": "box",
      "layout": "vertical",
      "contents": [],
      "flex": 0
    };
    const eachRowObject = {
      "type": "box",
      "layout": "horizontal",
      "contents": null,
      "spacing": "sm"
    };
    const flexFactorList = [30, 45, 20, 15];
    const headerData = ["日付", "天気", "確率", "信頼度"].map((columnName, i) => {
      const size = columnName === "信頼度" ? "xxs" : "sm";
      return {
        "type": "text",
        "text": columnName,
        "flex": flexFactorList[i],
        "align": "center",
        "wrap": false,
        "size": size,
        "gravity": "center"
      };
    });

    const headerDataWithSeparator = this.joinSeparator(headerData, separator);
    const finalHeaderData = this.insertStartAndEnd(headerDataWithSeparator, marginItem);
    const headerRowObject = {
      ...eachRowObject,
      "contents": finalHeaderData,
      "backgroundColor": "#9AC2C950"
    }

    const weeklyWeatherForecatData = weeklyWeatherForecast.map((row) => {
      const mainContents = row.map((item, i) => {
        return {
          "type": "text",
          "text": item,
          "align": "center",
          "flex": flexFactorList[i],
          "size": "sm"
        };
      });
      const contentsWithSeparator = this.joinSeparator(mainContents, separator);
      const weatherForcastContents = this.insertStartAndEnd(contentsWithSeparator, marginItem, marginItem);

      const weatherForcastEachDay = {
        ...eachRowObject,
        "contents": weatherForcastContents
      }
      return weatherForcastEachDay;
    });


    const contents = [
      {...headerRowObject},
      ...weeklyWeatherForecatData,
    ]

    const json = {
      "type": "flex",
      "altText": altText,
      "contents": {
        "type": "bubble",
        "hero": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "週間天気予報",
              "offsetEnd": "sm",
              "weight": "bold",
              "size": "lg",
              "color": "#1C4C73B0",
              "margin": "none"
            }
          ],
          "alignItems": "center",
          "backgroundColor": "#BFC3BAA5",
          "justifyContent": "center",
          "paddingAll": "lg",
          "paddingTop": "lg"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": contents,
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

  pushRichRainfallProbabilityMessage(payload, title, rainfallProbabilityDatas) {
    const lastRangeHour = rainfallProbabilityDatas[rainfallProbabilityDatas.length - 1][1];
    const hourNums = [...rainfallProbabilityDatas.map(item => item[0]), lastRangeHour];
    const hours = hourNums.map((item) => `${hourPadding(item)}時`);
    const rainfallProbabilityPercents = rainfallProbabilityDatas.map(item => `${item[2]}%`);
    const color = ["#1B5D9C","#EE6352","#FAC05E","#59CD90","#3099C0"];
    const rainfallAltTextList = rainfallProbabilityDatas.map((item) => `${hourPadding(item[0])}-${hourPadding(item[1])}時: ${item[2]}%`);
    const altText = [title, ...rainfallAltTextList].join("\n");
    console.log(`altText: \n${altText}`);
  
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
    
    for (let i = 0; i < hours.length; i++) {
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
                  "borderColor": color[i],
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
              "text": hours[i],
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
      if (i < hours.length - 1){
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
                "text": rainfallProbabilityPercents[i],
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