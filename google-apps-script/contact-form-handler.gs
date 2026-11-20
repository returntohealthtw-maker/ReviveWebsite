/**
 * 翔禾腦科學發展中心官網 - 聯絡表單 → Google 試算表 + Email 通知
 *
 * 使用方式請見同資料夾的 README.md。
 * 這段程式碼要貼到「Google 試算表」→「擴充功能」→「Apps Script」的編輯器中。
 */

// 收到新預約時，要同時通知的信箱（多個信箱用逗號分隔）
var NOTIFY_EMAIL = 'returntohealth.tw@gmail.com';

/**
 * 授權＋測試用：在 Apps Script 編輯器上方的函式選單選擇 testEmail，按「執行」。
 * 第一次執行會跳出「需要授權」視窗，授權「寄送電子郵件」後，
 * returntohealth.tw@gmail.com 會收到一封測試信，代表通知功能已啟用。
 */
function testEmail() {
  MailApp.sendEmail(
    NOTIFY_EMAIL,
    '【測試】官網預約通知信設定成功',
    '收到這封信，代表官網預約表單的 Email 通知功能已經啟用。'
  );
}

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

  var now = new Date();
  var serviceText = serviceMap[data.service] || data.service || '';
  var preferTimeText = preferTimeMap[data.preferTime] || data.preferTime || '';

  // 1. 寫入試算表（最重要，先做）
  sheet.appendRow([
    now,
    data.name || '',
    data.phone || '',
    data.email || '',
    serviceText,
    data.childAge || '',
    preferTimeText,
    data.message || ''
  ]);

  // 2. 寄 Email 通知（失敗也不影響試算表已寫入的資料）
  try {
    var timeText = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
    var subject = '【官網預約】' + (data.name || '未填姓名') + '｜' + (serviceText || '未選服務');
    var body =
      '官網收到一筆新的預約諮詢：\n\n' +
      '送出時間：' + timeText + '\n' +
      '姓名：' + (data.name || '') + '\n' +
      '聯絡電話：' + (data.phone || '') + '\n' +
      '電子信箱：' + (data.email || '（未填）') + '\n' +
      '感興趣的服務：' + serviceText + '\n' +
      '孩子年齡：' + (data.childAge || '（未填）') + '\n' +
      '希望聯絡時間：' + (preferTimeText || '（未填）') + '\n' +
      '問題或需求：\n' + (data.message || '（未填）') + '\n\n' +
      '— 此信由官網預約表單自動寄出，完整名單請至 Google 試算表查看。';

    var options = { name: '翔禾腦科學發展中心官網' };
    // 客戶有填信箱時，直接回覆這封信就會回給客戶
    if (data.email) {
      options.replyTo = data.email;
    }

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body, options);
  } catch (err) {
    console.error('寄送通知信失敗：' + err);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
