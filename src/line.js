const lineBaseEndpoint = 'https://api.line.me/v2/bot';

const getSecret_ = () => {
  const accessToken = PropertiesService.getScriptProperties().getProperty('accessToken');
  const secret = 'Bearer ' + accessToken;
  return secret;
};

const getJsonFromResponse = (response) => {
  return JSON.parse(response.getContentText());
};

const lineGetFetch_ = (path) => {
  const requestUrl = lineBaseEndpoint + path;
  const secret = getSecret_();
  const response = UrlFetchApp.fetch(requestUrl, {
    'headers': {
      'Authorization': secret,
    }
  });
  return getJsonFromResponse(response);
};

const linePostFetch_ = (path, payload) => {
  const secret = getSecret_();
  const requestUrl = lineBaseEndpoint + path;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': secret,
  };
  const options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(payload)
  };
  return getJsonFromResponse(response);
};

const reply =(payload) => {
  return linePostFetch_('/message/reply', payload);
};

const getUserName = (userId) => {
  const path = `/profile/${userId}`;
  const json = lineGetFetch_(path);
  return json.displayName;
};

const getGroupName = (groupId) => {
  const path = `/group/${groupId}/summary`;
  const json = lineGetFetch_(path);
  return json.groupName;
};

const getRoomMemberNames = (roomId, memberIds) => {
  const path = `/room/${roomId}/members/`;
  const names = memberIds.map((userId) => {
    const requestPath = path + userId;
    const json = lineGetFetch_(requestPath);
    return json.displayName;
  });
  return names;
};

const getRoomMemberIds = (roomId) => {
  const path = `/room/${roomId}/members/ids`;
  const json = lineGetFetch_(path);
  return json.memberIds;
};

const getRoomMemberName = (roomId) =>{
  const memberIds = getRoomMemberIds(roomId);
  const names = getRoomMemberNames(roomId, memberIds);
  const roomName = names.join(', ');
  return roomName;
};

const getEventSourceInfo = (source) => {
  if (source.type === 'room') {
    const roomId = source.roomId;
    const roomName = getRoomMemberName(roomId);
    return [roomId, roomName];
  } else if (source.type === 'group') {
    const groupId = source.groupId;
    const groupName = getGroupName(groupId);
    return [groupId, groupName];
  } else {
    const userId = source.userId;
    const userName = getUserName(userId);
    return [userId, userName];
  }
};

const createWeatherMessages = (payload) => {
  payload = pushTextMessage(payload, getWeatherOverview());
  payload = pushLichRainfallProbabilityMessage(payload, "今日の東京の天気")
  payload = pushTextMessage(payload, getWeeklyWeather());
  return payload;
};

const pushTextMessage = (payload,message) => {
  payload.messages.push({
    'type': 'text',
    'text': message
  });
  return payload;
}

const createSendMessagesData  = (to, messages) => {
  return {
    to,
    messages
  };
};

// userIdsは単数の場合stringでも可
const pushMessage = (userId, messages) => {
  const path = '/message/push';
  const payload = createSendMessagesData(userId, messages);
  return linePostFetch_(path, payload);
};

const pushMulticastMessage = (userIds, messages) => {
  const path = '/message/multicast';
  const payload = createSendMessagesData(userIds, messages);
  return linePostFetch_(path, payload);
}
