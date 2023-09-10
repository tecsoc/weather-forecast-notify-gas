
let sheet;

const UserIdColumn = 2;
const UserNameColumn = 3;
// 配信有効設定列
const LogicalDeleteFlagColumn = 4;
const DeliverySettingLastColumn = 12;
const DeliverySettingFirstColumn = 5;
const Setting_Length = DeliverySettingLastColumn - DeliverySettingFirstColumn + 1;
const FirstDataRow = 3;

function setSheet(sheet_name){
  const sheetId = PropertiesService.getScriptProperties().getProperty('sheetId');
  if(!sheetId) throw new Error('シートIDが不正です');
  try {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    sheet = spreadsheet.getSheetByName(sheet_name);
  }
}

const searchRow  = (sheet, column, value) => {
  const rangeList = sheet.getRange(1, column, sheet.getLastRow()).getValues();
  const index = rangeList.findIndex((row) => row[0] === value);
  return index;
};

const getUserIndex = (userId) => {
  return searchRow(sheet, UserIdColumn, userId);
};

const getWeekdayRangeByUser = (index) => {
  return sheet.getRange(index, DeliverySettingFirstColumn, 1, Setting_Length);
};

const setSetting = (userId, settings) => {
  setSheet('天気配信管理');
  const userIdIndex = getUserIndex(userId);
  if (userIdIndex === -1) return false;
  try {
    getWeekdayRangeByUser(userIdIndex).setValues([settings]);
    return true;
  } catch {
    return false;
  }
};

const getSetting = (userId) => {
  setSheet('天気配信管理');
  const userIdIndex = getUserIndex(userId);
  if (userIdIndex === -1) return [];
  const settings = getWeekdayRangeByUser(userIdIndex).getValues()[0];
  return settings;
};

// 論理削除フラグを変更
const setLogicalDeleteFlag = (index, flag) => {
  setSheet('天気配信管理');
  if (index === -1) return;s
  sheet.getRange(index, LogicalDeleteFlagColumn).setValue(flag);
};

const insertUser = (userId, userName) => {
  setSheet('天気配信管理');
  const row = sheet.getLastRow() + 1;
  const initialSettings = [1, 1, 1, 1, 1, 1, 1, 1, 1];
  const values = [[userId, userName, ...settings]];
  sheet.getRange(row, UserIdColumn, 1, DeliverySettingLastColumn - UserNameColumn + 1).setValues(values);
};

const getWeekdayColumn = () => {
  const weekday = getWeekday();
  if (isHoliday()) {
    return DeliverySettingLastColumn;
  }
  return weekday + DeliverySettingFirstColumn - 1;
};

const getPushUserList = () => {
  setSheet("天気配信管理");
  const weekdayColumn = getWeekdayColumn();
  // 天気配信管理スプシからデータを取得
  const lastRow = sheet.getLastColumn() - FirstDataRow + 1;
  const lastColumn = weekdayColumn - UserIdColumn + 1;
  const database = sheet.getRange(FirstDataRow, UserIdColumn, lastRow, lastColumn).getValues();
  // 送信するユーザーリスト
  const userList = database.flatMap((row) => {
    const logicalDeleteFlagIndex = LogicalDeleteFlagColumn - UserIdColumn;
    if (row[logicalDeleteFlagIndex] !== 1) return [];
    const weekdayIndex = weekdayColumn - DeliverySettingFirstColumn;
    if (row[weekdayIndex] !== 1) return [];
    return row[0];
  });
  return userList;
};


const setRainfallProbability = (rainfallProbabilityArray) => {
  setSheet('降水確率');
  sheet.clearContents();
  sheet.getRange(1, 1, rainfallProbabilityArray.length, rainfallProbabilityArray[0].length).setValues(rainfallProbabilityArray);
};

const setWeatherOverviewToSheet = (value) =>  {
  setSheet('天気概況');
  sheet.getRange(1, 1).setValue(value);
}

const setWeeklyWeatherForecastToSheet = (weeklyWeatherForecastArray) => {
  setSheet('週間天気予報');
  sheet.clearContents();
  sheet.getRange(1, 1, weeklyWeatherForecastArray.length, weeklyWeatherForecastArray[0].length).setValues(weeklyWeatherForecastArray);
}