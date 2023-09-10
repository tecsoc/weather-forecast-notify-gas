
let sheet;

class SpreadSheet {
  static UserIdColumn = 2;
  static UserNameColumn = 3;
  // 配信有効設定列
  static LogicalDeleteFlagColumn = 4;
  static DeliverySettingLastColumn = 12;
  static DeliverySettingFirstColumn = 5;
  static SettingLength = DeliverySettingLastColumn - DeliverySettingFirstColumn + 1;
  static FirstDataRow = 3;
  static RainfallProbabilityPercentColumn = 3;
  static editing = {};
  // 排他待機時間
  static waitTimeForExclusive = 500;
  sheet;

  setSheet(sheetName) {
    const sheetId = PropertiesService.getScriptProperties().getProperty('sheetId');
    if (!sheetId) throw new Error('シートIDが不正です');
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      this.sheet = spreadsheet.getSheetByName(sheetName);
      this.sheetName = sheetName;
      SpreadSheet.editing = {
        sheetName,
        range: {}
      }
    } catch (e) {
      console.error(e);
      throw new Error('シートの取得に失敗しました');
    }
  }

  canEdit(targetFirstRow, targetFirstColumn, targetLastRow = 1, targetLastColumn = 1) {
    if (SpreadSheet.editing.sheetId !== this.sheetName) return true;
    if (Object.keys(SpreadSheet.editing.range).length === 0) return true;
    const  { firstRow, firstColumn, lastRow, lastColumn } = SpreadSheet.editing.range;
    if (firstRow > targetFirstRow && lastRow < targetLastRow && firstColumn > targetFirstColumn && lastColumn < targetLastColumn) {
      return  true;
    }
    return false
  }

  clearContents() {
    while (SpreadSheet.editing.sheetId === this.sheetName) {
      Utilities.sleep(SpreadSheet.waitTimeForExclusive);
    }
    this.sheet.clearContents();
  }

  setValue(value, row, column) {
    while (!this.canEdit(row, column)) {
      Utilities.sleep(SpreadSheet.waitTimeForExclusive);
    }
    this.sheet.getRange(row, column).setValue(value);
  }

  setValues(valuea, firstRow, firstColumn, lastRow = 1, lastColumn = 1) {
    while (!this.canEdit(firstRow, firstColumn, lastRow, lastColumn)) {
      Utilities.sleep(SpreadSheet.waitTimeForExclusive);
    }
    this.sheet.getRange(firstRow, firstColumn, lastRow, lastColumn).setValues(values);
  }

  setDeliverySettingSheet() {
    this.setSheet('天気配信管理');
  }

  setRainfallProbabilitySheet() {
    this.setSheet('降水確率');
  }

  setWeatherOverviewSheet() {
    this.setSheet('天気概況');
  }

  setWeeklyWeatherForecastSheet() {
    this.setSheet('週間天気予報');
  };

  searchRow(column, value) {
    const rangeList = this.sheet.getRange(1, column, this.sheet.getLastRow()).getValues();
    const index = rangeList.findIndex((row) => row[0] === value);
    return index + 1;
  }

  getUserIndex(userId) {  
    return this.searchRow(SpreadSheet.UserIdColumn, userId);
  }

  getWeekdayRangeByUser(index) {
    return [index, SpreadSheet.DeliverySettingFirstColumn, 1, SpreadSheet.SettingLength];
  }
  setDeliverySettings(userId, settings) {
    this.setDeliverySettingSheet();
    const userIdIndex = this.getUserIndex(userId);
    if (userIdIndex === 0) return false;
    this.setValues(settings, ...this.getWeekdayRangeByUser(userIdIndex));
  }
  getDeliverySettings(userId) {
    this.setDeliverySettingSheet();
    const userIdIndex = this.getUserIndex(userId);
    if (userIdIndex === 0) return [];
    const settings = this.sheet.getRange(...this.getWeekdayRangeByUser(userIdIndex)).getValues();
    return settings;
  }

  // 論理削除フラグを変更
  setLogicalDeleteFlag(userId, flag) {
    this.setDeliverySettingSheet();
    const index = this.getUserIndex(userId);
    if (index === 0) return;
    this.setValue(flag, index + 1, SpreadSheet.LogicalDeleteFlagColumn);
  }

  setUserName(userId, userName) {
    const row = this.getUserIndex(userId);
    if (row === 0) return;
    this.setValue(userName, row, SpreadSheet.UserNameColumn);
  }

  insertUser(userId, userName) {
    this.setDeliverySettingSheet();
    const row = this.sheet.getLastRow() + 1;
    const initialSettings = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    const values = [[userId, userName, ...initialSettings]];
    this.setValues(values, row, SpreadSheet.UserIdColumn, 1, SpreadSheet.DeliverySettingLastColumn - SpreadSheet.UserNameColumn + 1);
  }

  getWeekdayColumn() {
    const weekday = getWeekday();
    if (isHoliday()) {
      return SpreadSheet.DeliverySettingLastColumn;
    }
    return weekday + SpreadSheet.DeliverySettingFirstColumn - 1;
  }

  getPushTargetUserList() {
    this.setDeliverySettingSheet();
    const weekdayColumn = this.getWeekdayColumn();
    const lastRow = this.sheet.getLastColumn() - SpreadSheet.FirstDataRow + 1;
    const lastColumn = weekdayColumn - SpreadSheet.UserIdColumn + 1;
    const database = this.sheet.getRange(SpreadSheet.FirstDataRow, SpreadSheet.UserIdColumn, lastRow, lastColumn).getValues();
    // 送信対象のユーザーIDリスト
    const userList = database.flatMap((row) => {
      const logicalDeleteFlagIndex = SpreadSheet.LogicalDeleteFlagColumn - SpreadSheet.UserIdColumn;
      if (row[logicalDeleteFlagIndex] !== 1) return [];
      const weekdayIndex = weekdayColumn - SpreadSheet.DeliverySettingFirstColumn;
      if (row[weekdayIndex] !== 1) return [];
      return row[0];
    });
    return userList;
  }

  getRainfallProbabilityPercentList(){
    this.setRainfallProbabilitySheet();
    const rainfallProbabilityData = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
    console.log(`降水確率:\n${rainfallProbabilityData}`);
    // 降水確率の配列の初期化
    const rainfallProbabilityPercent = Array.from({ length: 4 }, () => "-- %" );
    // 今日の日付をyyyy/mm/dd 形式で取得
    const today = Utilities.formatDate( new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
    rainfallProbabilityData.reverse().forEach((row, i) => {
      if (i >= rainfallProbabilityPercent.length) return;
      if (row[0] === today) {
        rainfallProbabilityPercent[rainfallProbabilityPercent.length - i] = row[SpreadSheet.RainfallProbabilityPercentColumn - 1];
      }
    });
    return parcent;
  }

  getWeatherOverview(){
    this.setWeatherOverviewSheet();
    return sheet.getRange(1, 1).getValue();
  }

  getWeeklyWeatherForecast() {
    this.setWeeklyWeatherForecastSheet();
    const weeklyWeatherForecastList = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
    const weekdayArray = "日月火水木金土";
    const messages = weeklyWeatherForecastList.map((row) => {
      const dateObject = new Date(row[0]);
      const weekdayStr = weekdayArray[dateObject.getDay()];
      row[0] = row[0].replace(/[0-9]{4}\//,"");
      row[0] += `(${weekdayStr})`;
      row[2] += "%";
      return row.join(" ");
    });
    return messages.join("\n");
  }

  setRainfallProbability (rainfallProbabilityList) {
    this.setDeliverySettingSheet();
    this.clearContents();
    this.setValues(rainfallProbabilityList, 1, 1, rainfallProbabilityList.length, rainfallProbabilityList[0].length);
  }

  setWeatherOverview(value) {
    this.setWeatherOverviewSheet();
    this.setValue(value, 1, 1);
  }

  setWeeklyWeatherForecast(weeklyWeatherForecastList) {
    this.setWeeklyWeatherForecastSheet();
    this.clearContents();
    this.setValues(weeklyWeatherForecastList, 1, 1, weeklyWeatherForecastList.length, weeklyWeatherForecastList[0].length)
  }
}