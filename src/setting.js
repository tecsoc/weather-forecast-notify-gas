const User_Row_Num = 2;
const Setting_Row_Num = 5;
const Start_Col_Num = 3;
const Setting_Length = 8;

getUseridList = () => sheet.getRange(Start_Col_Num, User_Row_Num, sheet.getLastRow()).getValues();
getUserIndex = (userId) => getUseridList().findIndex(item => item[0] === userId) + Start_Col_Num;
getWeekdayRangeByUser = (index) => sheet.getRange(index, Setting_Row_Num, 1, Setting_Length);

const setSetting = (userId, settings) => {
  setSheet('天気配信管理');
  const userIdIndex = getUserIndex(userId);
  if (userIdIndex === -1) return false;
  try {
    getWeekdayRange(userIdIndex).setValues([settings]);
    return true;
  } catch {
    return false;
  }
};

const getSetting = (userId) => {
  setSheet('天気配信管理');
  const userIdIndex = getUserIndex(userId);
  if (userIdIndex === -1) return false;
  const settings = getWeekdayRange(userIdIndex).getValues()[0];
  return settings;
}