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
    } catch (e) {
      console.error(e);
      throw new Error(`シートの取得に失敗しました。\nエラー内容: ${e}`);
    }
  }

  canEdit(currentBaseRow, currentBaseColumn, currentOffsetRow = 1, currentOffsetColumn = 1) {
    if (editing.sheetId) return false;
    else if (Object.keys(editing.range).length !== 0) {
      const  { baseRow, baseColumn, offsetRow, offsetColumn } = editing.range;
      if (baseRow === null || baseColumn === null || offsetRow === null || offsetColumn === null);
      else if (baseRow <= currentBaseRow && offsetRow >= baseColumn && baseColumn <= currentBaseColumn && offsetColumn >= currentOffsetColumn) {
        return false;
      }
    } else {
      return false;
    }
    const sheetId = this.sheet.getSheetId();
    editing = {
      sheetId,
      range: {
        baseRow: currentBaseRow,
        baseColumn: currentBaseColumn,
        offsetRow: currentOffsetRow,
        offsetColumn: currentOffsetColumn
      }
    };
    return true;
  }

  clearContents() {
    while (editing.sheetId === this.sheet.getSheetId()) {
      Utilities.sleep(this.waitTimeForExclusive);
    }
    this.sheet.clearContents();
    this.releaseEditLock();
  }

  releaseEditLock() {
    editing = {
      sheetId: '',
      range: {
        baseRow: null,
        baseColumn: null,
        offsetRow: null,
        offsetColumn: null
      }
    }
    console.log("編集ロックを解除しました。")
  }

  waitForCanEdit(baseRow, baseColumn, offsetRow = 1, offsetColumn = 1) {
    const startTime = new Date().getTime();
    const timeoutTime = startTime + this.timeOutMilliSec;
    while(editing.sheetId && !this.canEdit(baseRow, baseColumn, offsetRow, offsetColumn)) {
      const nowTime = new Date().getTime();
      if (nowTime > timeoutTime) {
        throw new Error("編集ロックが解除されませんでした。設定待機許容時間を超えたので終了します。");
      }
      console.log("編集ロック中です。ロックが解除されるのを待機します。");
      Utilities.sleep(this.waitTimeForExclusive);
    }
    console.log(`範囲: {${baseRow}, ${baseColumn}, ${offsetRow}, ${offsetColumn}} を編集ロックしました。`);
  }

  setValue(value, row, column) {
    this.waitForCanEdit(row, column);
    this.sheet.getRange(row, column).setValue(value);
    this.releaseEditLock();
  }

  setValues(values, baseRow, baseColumn, offsetRow = 1, offsetColumn = 1) {
    this.waitForCanEdit(baseRow, baseColumn, offsetRow, offsetColumn);
    this.sheet.getRange(baseRow, baseColumn, offsetRow, offsetColumn).setValues(values);
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
    this.setDeliverySettingSheet();
    return this.searchRow(this.UserIdColumn, userId);
  }

  getWeekdayRangeByUser(index) {
    return [index, this.DeliverySettingFirstColumn, 1, this.SettingLength];
  }

  setDeliverySettings(userId, settings) {
    this.setDeliverySettingSheet();
    const userIdIndex = this.getUserIndex(userId);
    if (userIdIndex === 0) return false;
    const values = [settings];
    this.setValues(values, ...this.getWeekdayRangeByUser(userIdIndex));
    this.releaseEditLock();
    return true;
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
    this.setValue(flag, index, this.LogicalDeleteFlagColumn);
    this.releaseEditLock();
  }

  setUserName(userId, userName) {
    const row = this.getUserIndex(userId);
    if (row === 0) return;
    this.setValue(userName, row, this.UserNameColumn);
    this.releaseEditLock();
  }

  insertUser(userId, userName) {
    this.setDeliverySettingSheet();
    const row = this.sheet.getLastRow() + 1;
    const initialSettings = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    const values = [[userId, userName, ...initialSettings]];
    this.setValues(values, row, this.UserIdColumn, 1, this.DeliverySettingLastColumn - this.UserIdColumn + 1);
    this.releaseEditLock();
  }

  getWeekdayColumn() {
    const weekday = getWeekday();
    if (isHoliday()) {
      return this.DeliverySettingLastColumn;
    }
    return weekday + this.DeliverySettingFirstColumn;
  }

  getPushTargetUserList() {
    this.setDeliverySettingSheet();
    const offsetColumn = this.getWeekdayColumn();
    const offsetRow = this.sheet.getLastRow() - this.FirstDataRow + 1;
    const database = this.sheet.getRange(this.FirstDataRow, 1, offsetRow, offsetColumn).getValues();
    const logicalDeleteIndex = this.LogicalDeleteFlagColumn - 1;
    const weekdayIndex = offsetColumn - 1;
    const userIdIndex = this.UserIdColumn - 1;
    const pushTargetuserList = database.flatMap((row) => {
      console.log(`データ:${row[logicalDeleteIndex]}, データ型${typeof row[logicalDeleteIndex]}`);
      if (row[logicalDeleteIndex] === 1) {
        if (row[weekdayIndex] === 1) {
          return row[userIdIndex];
        } 
      }
      return [];
    });
    return pushTargetuserList;
  }

  getRainfallProbabilityPercentList(){
    this.setRainfallProbabilitySheet();
    const rainfallProbabilityData = this.sheet.getRange(1, 1, this.sheet.getLastRow(), this.sheet.getLastColumn()).getDisplayValues();
    console.log(`降水確率:\n${rainfallProbabilityData}`);
    // 降水確率の配列の初期化
    const rainfallProbabilityPercent = Array.from({ length: 4 }, () => "-- %" );
    // 後ろから走査して後ろから順番にデータを入れたいのでreverseしたデータを保持
    // （現在時刻によって天気が4つない場合があるため）
    const reversedRainfallProbabilityData = rainfallProbabilityData.reverse();
    const today = Utilities.formatDate( new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
    for (let i = 0, matchCount = 0; i < reversedRainfallProbabilityData.length && matchCount < reversedRainfallProbabilityData.length; i++) {
      if (reversedRainfallProbabilityData[i][0] === today) {
        rainfallProbabilityPercent[rainfallProbabilityPercent.length - 1 - matchCount] = reversedRainfallProbabilityData[i][this.RainfallProbabilityPercentColumn - 1];
        matchCount++;
      }
    };
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
      row[2] += row[2] ? "%" : '-';
      return row.join(" ");
    });
    return weeklyWeatherForecastList;
  }

  setRainfallProbability (rainfallProbabilityList) {
    this.setRainfallProbabilitySheet();
    this.clearContents();
    this.setValues(rainfallProbabilityList, 1, 1, rainfallProbabilityList.length, rainfallProbabilityList[0].length);
    this.releaseEditLock();
  }

  setWeatherOverview(value) {
    this.setWeatherOverviewSheet();
    this.setValue(value, 1, 1);
    this.releaseEditLock();
  }

  setWeeklyWeatherForecast(weeklyWeatherForecastList) {
    this.setWeeklyWeatherForecastSheet();
    this.clearContents();
    this.setValues(weeklyWeatherForecastList, 1, 1, weeklyWeatherForecastList.length, weeklyWeatherForecastList[0].length)
    this.releaseEditLock();
  }
}