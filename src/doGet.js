const doGet = (e) => {
  const response = {};
  const userId = e.parameter.userId;
  if (e.parameter.type === 'updateSetting') {
    const result = setSetting(userId, e.parameters.settings);
    response.result = result;
  } else {
    const settings = getSetting(userId);
    response.settings = settings;
  }
  return returnJson(response);
}