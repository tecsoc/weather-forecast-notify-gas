let editing = {};

class SpreadSheet {
  
  constructor() {
    this.UserIdColumn = 2;
    this.UserNameColumn = 3;
    // 配信有効設定列
    this.LogicalDeleteFlagColumn = 4;
    this.DeliverySettingLastColumn = 12;
    this.DeliverySettingFirstColumn = 5;
    this.SettingLength = this.DeliverySettingLastColumn - this.DeliverySettingFirstColumn + 1;
    this.FirstDataRow = 3;
    this.RainfallProbabilityPercentColumn = 3;
    // 排他待機時間
    this.waitTimeForExclusive = 500;
    this.timeOutMilliSec = 10000;

    const sheetId = PropertiesService.getScriptProperties().getProperty('sheetId');
    if (!sheetId) throw new Error(`シートIDが不正です\nエラー内容: ${e}`);
    this.spreadsheet = SpreadsheetApp.openById(sheetId);
  }

  setSheet(sheetName) {
    try {
      this.sheet = this.spreadsheet.getSheetByName(sheetName);
      editing = {
        sheetName: "",
        range: {}
      }
    } catch (e) {
      console.error(e);
      throw new Error(`シートの取得に失敗しました。\nエラー内容: ${e}`);
    }
  }

  canEdit(targetFirstRow, targetFirstColumn, targetLastRow = 1, targetLastColumn = 1) {
    if (editing.sheetName === this.sheetName) return false;
    else if (Object.keys(editing.range).length !== 0) {
      const  { firstRow, firstColumn, lastRow, lastColumn } = editing.range;
      if (firstRow <= targetFirstRow && lastRow >= targetFirstRow && firstColumn <= targetFirstColumn && lastColumn >= targetFirstColumn) {
        return false;
      }
    } else {
      return false;
    }
    editing.sheetName = this.sheetName;
    editing.range = {
      firstRow: targetFirstRow,
      firstColumn: targetFirstColumn,
      lastRow: targetLastRow,
      lastColumn: targetLastColumn
    };
    return true;
  }

  clearContents() {
    while (editing.sheetName === this.sheetName) {
      Utilities.sleep(this.waitTimeForExclusive);
    }
    const beforeSheetName = editing.sheetName;
    editing.sheetName = this.sheetName;
    this.sheet.clearContents();
    editing.sheetName = beforeSheetName;
  }

  releaseEditLock() {
    editing.range = {};
    editing.sheetName = "";
    console.log("編集ロックを解除しました。")
  }

  waitForCanEdit(firstRow, firstColumn, lastRow = 1, lastColumn = 1) {
    const startTime = new Date().getTime();
    const timeoutTime = startTime + timeOutMilliSec;
    console.log(`範囲: ${firstRow}, ${firstColumn}, ${lastRow}, ${lastColumn}`);
    while(this.sheetName === editing.sheetName && !this.canEdit(firstRow, firstColumn, lastRow, lastColumn)) {
      const nowTime = new Date().getTime();
      if (nowTime > timeoutTime) {
        throw new Error("編集ロックが解除されませんでした。設定待機許容時間を超えたので終了します。");
      }
      console.log("編集ロック中です。ロックが解除されるのを待機します");
      Utilities.sleep(this.waitTimeForExclusive);
    }
  }

  setValue(value, row, column) {
    this.waitForCanEdit(row, column);
    this.sheet.getRange(row, column).setValue(value);
    this.releaseEditLock();
  }

  setValues(valuea, firstRow, firstColumn, lastRow = 1, lastColumn = 1) {
    this.waitForCanEdit(firstRow, firstColumn, lastRow, lastColumn);
    this.sheet.getRange(firstRow, firstColumn, lastRow, lastColumn).setValues(values);
    this.releaseEditLock();
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
    return this.searchRow(this.UserIdColumn, userId);
  }

  getWeekdayRangeByUser(index) {
    return [index, this.DeliverySettingFirstColumn, 1, this.SettingLength];
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
    return settings[0];
  }

  // 論理削除フラグを変更
  setLogicalDeleteFlag(userId, flag) {
    this.setDeliverySettingSheet();
    const index = this.getUserIndex(userId);
    if (index === 0) return;
    this.setValue(flag, index + 1, this.LogicalDeleteFlagColumn);
  }

  setUserName(userId, userName) {
    const row = this.getUserIndex(userId);
    if (row === 0) return;
    this.setValue(userName, row, this.UserNameColumn);
  }

  insertUser(userId, userName) {
    this.setDeliverySettingSheet();
    const row = this.sheet.getLastRow() + 1;
    const initialSettings = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    const values = [[userId, userName, ...initialSettings]];
    this.setValues(values, row, this.UserIdColumn, 1, this.DeliverySettingLastColumn - this.UserNameColumn + 1);
  }

  getWeekdayColumn() {
    const weekday = getWeekday();
    if (isHoliday()) {
      return this.DeliverySettingLastColumn;
    }
    return weekday + this.DeliverySettingFirstColumn - 1;
  }

  getPushTargetUserList() {
    this.setDeliverySettingSheet();
    const weekdayIndex = this.getWeekdayColumn();
    const weekdayColumn = weekdayIndex  + this.DeliverySettingFirstColumn - this.UserIdColumn + 1;
    const lastRow = this.sheet.getLastRow() - this.FirstDataRow + 1;
    const lastColumn = weekdayIndex - this.UserIdColumn + 1;
    const database = this.sheet.getRange(this.FirstDataRow, this.UserIdColumn, lastRow, lastColumn).getValues();
    // 送信対象のユーザーIDリスト
    const userList = database.flatMap((row) => {
      const logicalDeleteFlagIndex = this.LogicalDeleteFlagColumn - this.UserIdColumn;
      console.log(`データ:${row[logicalDeleteFlagIndex]}, データ型${typeof row[logicalDeleteFlagIndex]}`);
      if (row[logicalDeleteFlagIndex] !== 1) return [];
      if (row[weekdayColumn] !== 1) return [];
      return row[0];
    });
    return userList;
  }

  getRainfallProbabilityPercentList(){
    this.setRainfallProbabilitySheet();
    const rainfallProbabilityData = this.sheet.getRange(1, 1, this.sheet.getLastRow(), this.sheet.getLastColumn()).getDisplayValues();
    console.log(`降水確率:\n${rainfallProbabilityData}`);
    // 降水確率の配列の初期化
    const rainfallProbabilityPercent = Array.from({ length: 4 }, () => "-- %" );
    // 今日の日付をyyyy/mm/dd 形式で取得
    const today = Utilities.formatDate( new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
    rainfallProbabilityData.reverse().forEach((row, i) => {
      if (i >= rainfallProbabilityPercent.length) return;
      if (row[0] === today) {
        rainfallProbabilityPercent[rainfallProbabilityPercent.length - i] = row[this.RainfallProbabilityPercentColumn - 1];
      }
    });
    return rainfallProbabilityPercent;
  }

  getWeatherOverview(){
    this.setWeatherOverviewSheet();
    return this.sheet.getRange(1, 1).getValue();
  }

  getWeeklyWeatherForecast() {
    this.setWeeklyWeatherForecastSheet();
    const weeklyWeatherForecastList = this.sheet.getRange(1, 1, this.sheet.getLastRow(), this.sheet.getLastColumn()).getDisplayValues();
    const weekdayArray = "日月火水木金土";
    weeklyWeatherForecastList.forEach((row) => {
      const dateObject = new Date(row[0]);
      const weekdayStr = weekdayArray[dateObject.getDay()];
      row[0] = row[0].replace(/[0-9]{4}\//,"");
      row[0] += `(${weekdayStr})`;
      row[2] += "%";
      return row.join(" ");
    });
    return weeklyWeatherForecastList;
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