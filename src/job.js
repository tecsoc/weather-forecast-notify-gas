const everyMorning = () => {
  fetchJMAWeatherInfo();
  pushWeatherForecastForTargetUser();
};

const pushWeatherForecastForTargetUser = () => {
  const pushUserIdList = getPushUserList();
  if (pushUserIdList.length <= 1) return;  
  console.log(`pushUserIdList: ${pushUserIdList}`);
  const messages = createWeatherMessages();
  console.log(`messages: ${messages}`);
  const response = pushMulticastMessage(pushUserIdList, messages);
  console.log(`response: ${response}`);
};

const fetchJMAWeatherInfo = () => {
  const fetchWeatherHandler = new fetchJMA();
  const rainfallProbabilityArray = fetchWeatherHandler.getRainfallProbability();
  console.log(`降水確率: ${rainfallProbabilityArray}`);
  setRainfallProbability(rainfallProbabilityArray);
  const weatherOverview = fetchWeatherHandler.getWeatherOverview();
  console.log(`天気概況:\n${weatherOverview}`);
  setWeatherOverviewToSheet(weatherOverview);
  const weeklyWeatherForecastArray = GetWeatherHandler.getWeeklyWeatherForecast();
  console.log(`週間天気予報: ${weeklyWeatherForecastArray}`);
  setWeeklyWeatherForecastToSheet(weeklyWeatherForecastArray);z
};