const setSetting = (userid, settings) => {
  const User_Row_Num = 2;
  const Start_Col_Num = 3;
  setSheet('天気配信管理');
  const userIdList = sheet.getRange(Start_Col_Num, User_Row_Num, sheet.getLastRow()).getValues();
  const userIdIndex = userIdList.indexOf(userid);
  if (userIdIndex === -1) return false;
  try {
    sheet.setRange(userIdIndex + Start_Col_Num, 1, settings.length).setValues(settings);
    return true;
  } catch {
    return false;
  }
};