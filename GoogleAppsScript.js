
/**
 * ID PHOTO BOOTH PRO - BACKEND ENGINE
 * Dành cho Google Apps Script
 *
 * Ảnh được upload lên Google Drive (không nhét base64 trực tiếp vào Sheet —
 * tránh lỗi vượt giới hạn 50.000 ký tự/ô). Sheet chỉ lưu link Drive.
 *
 * getPhoto() (xem 1 ảnh cụ thể — dùng cho trang xem ảnh qua QR và tính năng
 * "dùng điện thoại làm camera") tải lại file từ Drive và trả về đúng dạng
 * base64 data URL như trước đây, để không phá vỡ các thao tác vẽ canvas
 * (tải ảnh đơn / tạo file in) ở phía client — ảnh tải trực tiếp từ Drive qua
 * <img crossOrigin> có thể bị chặn CORS khi đưa vào canvas.toDataURL().
 *
 * listPhotos() (danh sách thư viện) vẫn trả thẳng link Drive vì chỉ hiển thị
 * <img> thường, không cần base64 — tải 50 ảnh base64 cùng lúc sẽ rất nặng.
 *
 * CÁCH DEPLOY (bắt buộc làm thủ công qua tài khoản Google của bạn — không thể
 * tự động hoá từ đây). Có 2 cách, chọn 1:
 *
 * CÁCH A — Bound script (khuyên dùng, không cần điền gì thêm):
 * 1. Mở Google Sheet đang dùng làm database cho ID Photo Booth Pro
 * 2. Extensions → Apps Script (mở đúng script đã "bound" sẵn vào Sheet này)
 * 3. Dán đè toàn bộ nội dung file này vào Code.gs
 * 4. Deploy → Manage deployments → chọn deployment hiện tại → nút sửa (✏️)
 *    → Version: "New version" → Deploy (giữ nguyên URL /exec cũ)
 *
 * CÁCH B — Standalone project (project độc lập, tạo qua script.new hoặc nút
 * "New project" trên script.google.com — KHÔNG gắn sẵn vào Sheet nào):
 * 1. Mở Google Sheet dùng làm database → copy Sheet ID trong URL
 *    (https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit)
 * 2. Dán ID đó vào biến SHEET_ID bên dưới trước khi deploy
 * 3. Deploy như bình thường (New deployment hoặc New version đều được)
 * Nếu bỏ qua bước điền SHEET_ID ở cách B, mọi request sẽ lỗi
 * "Cannot read properties of null (reading 'getSheetByName')" vì script
 * không biết phải thao tác trên Sheet nào.
 */

// Optional: ID thư mục Google Drive để lưu ảnh (để trống = lưu vào My Drive gốc)
var DRIVE_FOLDER_ID = "";

// ID của Google Sheet dùng làm database (lấy từ URL Sheet, đoạn giữa /d/ và /edit).
// BẮT BUỘC phải điền nếu deploy project Apps Script ĐỘC LẬP (standalone — tạo qua
// script.new hoặc script.google.com "New project"), vì khi đó không có "active
// spreadsheet" để tự nhận diện, gây lỗi "Cannot read properties of null
// (reading 'getSheetByName')". Nếu để trống, script sẽ dùng
// SpreadsheetApp.getActiveSpreadsheet() — chỉ hoạt động khi mở Apps Script từ
// chính Sheet đó qua Extensions → Apps Script (script "bound" vào Sheet).
var SHEET_ID = "1EeT_ub_SRcfYual0Zrri91RdrGzEu9Ns5daZotwSQ-g";

function getSpreadsheet() {
  if (SHEET_ID && SHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(SHEET_ID.trim());
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('Không tìm thấy Google Sheet. Nếu đây là Apps Script project độc lập (standalone), hãy điền SHEET_ID ở đầu file.');
  }
  return active;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Đợi tối đa 10 giây

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = { success: false };

    // Khởi tạo các Sheet nếu chưa có
    initSheets();

    if (action === 'savePhoto') {
      result = savePhoto(data);
    } else if (action === 'getPhoto') {
      result = getPhoto(data.id);
    } else if (action === 'listPhotos') {
      result = listPhotos();
    } else if (action === 'deletePhoto') {
      result = deletePhoto(data);
    } else if (action === 'saveConfig') {
      result = saveConfig(data.config);
    } else if (action === 'getConfig') {
      result = getConfig();
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function initSheets() {
  var ss = getSpreadsheet();

  // Sheet lưu ảnh
  if (!ss.getSheetByName('Photos')) {
    var photoSheet = ss.insertSheet('Photos');
    photoSheet.appendRow(['ID', 'Timestamp', 'DataUrl', 'Settings']);
    photoSheet.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Sheet lưu cấu hình
  if (!ss.getSheetByName('Config')) {
    var configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['Key', 'Value']);
    configSheet.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
  }
}

// Upload ảnh base64 (data:image/...;base64,....) lên Google Drive và trả về link xem trực tiếp.
function uploadDataUrlToDrive(dataUrl, fileName) {
  var splitBase64 = dataUrl.split(',');
  var dataPart = splitBase64.length > 1 ? splitBase64[1] : splitBase64[0];
  var bytes = Utilities.base64Decode(dataPart);
  var blob = Utilities.newBlob(bytes, 'image/png', fileName || 'photo.png');

  var folder;
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim() !== '') {
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    url: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w4000",
    fileId: file.getId()
  };
}

// Trích fileId từ link Drive đã lưu trong Sheet (dạng thumbnail?id=...).
function extractDriveFileId(storedValue) {
  if (!storedValue || typeof storedValue !== 'string') return null;
  var match = storedValue.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Xoá file Drive cũ (nếu có) khi ghi đè cùng 1 ID, tránh rác Drive.
function deleteDriveFileIfLinked(storedValue) {
  var fileId = extractDriveFileId(storedValue);
  if (!fileId) return;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (e) {
    // File đã bị xoá trước đó hoặc không có quyền — bỏ qua.
  }
}

// Với giá trị đã lưu trong Sheet là link Drive, tải lại file và trả về đúng
// dạng base64 data URL để phía client dùng cho canvas (tải ảnh/tạo file in)
// không bị lỗi CORS. Nếu là dòng cũ còn lưu base64 thô (trước khi có Drive),
// trả về nguyên trạng.
function resolveStoredValueToDataUrl(storedValue) {
  if (!storedValue || typeof storedValue !== 'string') return storedValue;
  if (storedValue.indexOf('data:') === 0) return storedValue;

  var fileId = extractDriveFileId(storedValue);
  if (!fileId) return storedValue;

  try {
    var blob = DriveApp.getFileById(fileId).getBlob();
    return 'data:image/png;base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return storedValue; // Không tải được (đã xoá/mất quyền) — trả link thô để không vỡ hoàn toàn.
  }
}

function savePhoto(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Photos');
  var id = data.id || ('IMG_' + new Date().getTime());

  // Xóa ảnh cũ nếu trùng ID (để tránh rác khi chụp lại trên mobile)
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      deleteDriveFileIfLinked(rows[i][2]);
      sheet.deleteRow(i + 1);
      break;
    }
  }

  // Nếu là ảnh base64 thô, upload lên Drive và chỉ lưu link vào Sheet.
  var storedUrl = data.dataUrl;
  if (typeof storedUrl === 'string' && storedUrl.indexOf('data:') === 0) {
    var uploadResult = uploadDataUrlToDrive(storedUrl, id + '.png');
    storedUrl = uploadResult.url;
  }

  sheet.appendRow([
    id,
    data.timestamp || new Date().getTime(),
    storedUrl,
    JSON.stringify(data.settings)
  ]);

  return { success: true, id: id };
}

function getPhoto(id) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Photos');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      return {
        success: true,
        photo: {
          id: rows[i][0],
          timestamp: rows[i][1],
          dataUrl: resolveStoredValueToDataUrl(rows[i][2]),
          settings: JSON.parse(rows[i][3])
        }
      };
    }
  }
  return { success: false, error: 'Not found' };
}

function listPhotos() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Photos');
  var rows = sheet.getDataRange().getValues();
  var photos = [];

  // Trả về tối đa 50 ảnh gần nhất
  var start = Math.max(1, rows.length - 50);
  for (var i = rows.length - 1; i >= start; i--) {
    photos.push({
      id: rows[i][0],
      timestamp: rows[i][1],
      dataUrl: rows[i][2],
      settings: JSON.parse(rows[i][3])
    });
  }
  return { success: true, photos: photos };
}

function deletePhoto(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Photos');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      deleteDriveFileIfLinked(rows[i][2]);
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function saveConfig(config) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Config');
  sheet.clear();
  sheet.appendRow(['Key', 'Value']);
  sheet.appendRow(['app_settings', JSON.stringify(config)]);
  return { success: true };
}

function getConfig() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Config');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == 'app_settings') {
      return { success: true, config: JSON.parse(rows[i][1]) };
    }
  }
  return { success: false };
}
