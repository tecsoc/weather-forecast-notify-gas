const doGet = (e) => {
  const response = {};
  const userId = e.parameter.userId;
  if (e.parameter.type === 'updateSetting') {
    const result = setSetting(userId, e.parameters.settings);
    response.result = result;
  } else {
    const settings = getSetting(userId);
    if (settings.length) {
      response.settings = settings;
    } else {
      response.error = `Not Found User: ${userId}`;
    }
  }
  return returnJson(response);
}