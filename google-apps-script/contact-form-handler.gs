/**
 * 納醫芽官網 - 聯絡表單 → Google 試算表 接收端
 *
 * 使用方式請見同資料夾的 README.md。
 * 這段程式碼要貼到「Google 試算表」→「擴充功能」→「Apps Script」的編輯器中。
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 第一次執行時，如果試算表是空的，自動加上標題列
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '送出時間',
      '姓名',
      '聯絡電話',
      '電子信箱',
      '感興趣的服務',
      '孩子年齡（兒童課程）',
      '希望聯絡時間',
      '問題或需求'
    ]);
  }

  var data = e.parameter || {};

  var serviceMap = {
    children: '兒童專注力整合課程',
    neurofeedback: '神經回饋療程',
    eeg: '腦波狀態檢測',
    bioscan: 'AI高維生物掃描',
    hydrogen: 'H2 腦屏障修復矩陣',
    cognitive: '潛意識認知解碼',
    'family-resonance': '親子腦波共振陪跑',
    other: '其他'
  };

  var preferTimeMap = {
    morning: '上午 09:00–12:00',
    afternoon: '下午 13:00–17:00',
    evening: '傍晚 17:00–18:00',
    anytime: '任何時間皆可'
  };

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.email || '',
    serviceMap[data.service] || data.service || '',
    data.childAge || '',
    preferTimeMap[data.preferTime] || data.preferTime || '',
    data.message || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
