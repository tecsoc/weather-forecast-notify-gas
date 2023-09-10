const everyMorning = () => {
  fetchJMAWeatherInfo();
  pushWeatherForecastForTargetUser();
};

const pushWeatherForecastForTargetUser = () => {
  const sheet = new SpreadSheet();
  const pushUserIdList = getPushTargetUserList();
  if (pushUserIdList.length <= 1) return;  
  const payload = {
    to: pushUserIdList,
    messages: []
  };
  createTemplateMessage(sheet, payload);
  pushMulticastMessage(payload);
};

const createTemplateMessage = (sheet, payload) => {
  const weatherOverview = sheet.getWeatherOverview();
  console.log(`天気概況:\n\n${weatherOverview}`);
  const rainfallProbabilityPercentList = sheet.getRainfallProbabilityPercentList();
  console.log(`\n\\n降水確率:\n${rainfallProbabilityPercentList}`);
  const weeklyWeatherForecast = sheet.getWeeklyWeatherForecast();
  console.log(`\n週間天気予報:\n${weeklyWeatherForecast}`);
  payload = createWeatherMessages(payload, weatherOverview, rainfallProbabilityPercentList, weeklyWeatherForecast);
  return payload;
}

const fetchJMAWeatherInfo = () => {
  const fetchWeatherHandler = new fetchJMA();
  const sheet = new SpreadSheet();
  const rainfallProbabilityList = fetchWeatherHandler.getRainfallProbability();
  console.log(`降水確率: ${rainfallProbabilityList}`);
  sheet.setRainfallProbability(rainfallProbabilityList);
  const weatherOverview = fetchWeatherHandler.fetchWeatherOverview();
  console.log(`天気概況:\n${weatherOverview}`);
  sheet.setWeatherOverview(weatherOverview);
  const weeklyWeatherForecastList = fetchWeatherHandler.getWeeklyWeatherForecast();
  console.log(`週間天気予報: ${weeklyWeatherForecastList}`);
  sheet.setWeeklyWeatherForecast(weeklyWeatherForecastList);
};