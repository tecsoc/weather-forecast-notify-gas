const doGet = (e) => {
  const userId = e.parameter.userId;
  const settings = getSetting(userId);
  const response = {
    settings
  };
  returnJson(response);
}