/**
 * =========================================================================
 * ID PHOTO BOOTH PRO - GOOGLE APPS SCRIPT CLOUD BACKEND
 * =========================================================================
 * Cách hoạt động: ảnh được lưu thành FILE trong một thư mục Google Drive,
 * Google Sheet chỉ lưu đường dẫn (link) tới file đó + cài đặt của ảnh.
 * Sheet KHÔNG BAO GIỜ chứa dữ liệu ảnh base64 (tránh lỗi "getValues on object Range").
 *
 * getPhoto() (trang xem ảnh qua QR, tính năng "dùng điện thoại làm camera") tải lại
 * file từ Drive và trả về base64 data URL như trước, để client vẽ canvas (tải ảnh /
 * tạo file in) không bị chặn CORS. listPhotos() trả thẳng link Drive (chỉ hiển thị).
 *
 * MÃ ẢNH: ID_PREFIX + ddmmyy + NNN (vd: IP251025001 = ảnh thứ 1 ngày 25/10/2025),
 * do script này cấp để nhiều máy lưu cùng lúc không bị trùng số.
 *
 * HƯỚNG DẪN CÀI ĐẶT / CẬP NHẬT:
 * BƯỚC 1: Mở Google Sheet dùng làm database -> Tiện ích mở rộng (Extensions) > Apps Script
 *         (hoặc project độc lập: điền SHEET_ID bên dưới).
 * BƯỚC 2: Dán đè toàn bộ file này vào Code.gs.
 * BƯỚC 3: Cài đặt dự án (⚙️ Project Settings) -> bật "Hiển thị tệp kê khai appsscript.json"
 *         rồi sửa appsscript.json thành (giữ nguyên các khóa khác nếu có):
 *         {
 *           "timeZone": "Asia/Ho_Chi_Minh",
 *           "runtimeVersion": "V8",
 *           "oauthScopes": [
 *             "https://www.googleapis.com/auth/spreadsheets",
 *             "https://www.googleapis.com/auth/drive",
 *             "https://www.googleapis.com/auth/script.external_request"
 *           ]
 *         }
 *         "timeZone" quyết định phần ddmmyy của mã ảnh (phải là giờ Việt Nam).
 * BƯỚC 4: (Tuỳ chọn) Điền DRIVE_FOLDER_ID để dùng thư mục Drive có sẵn
 *         (ID là đoạn cuối của link: drive.google.com/drive/folders/<ID>).
 *         Để trống = tự tìm/tạo thư mục tên DRIVE_FOLDER_NAME trong My Drive.
 * BƯỚC 5: Chọn hàm "authorizeDriveAccess" ở thanh công cụ -> bấm Chạy (Run) ->
 *         cấp quyền Sheets + Drive khi Google hỏi (chỉ cần làm 1 lần).
 * BƯỚC 6: Triển khai (Deploy) > Quản lý bản triển khai (Manage deployments) -> chọn
 *         deployment app đang dùng -> sửa (✏️) -> Phiên bản (Version): Mới (New version)
 *         -> Triển khai. Giữ nguyên URL /exec cũ. Web app phải là
 *         Execute as: Tôi (Me) | Who has access: Bất kỳ ai (Anyone).
 * Mỗi lần sửa code: phải làm lại BƯỚC 6 (Phiên bản: Mới), nếu không URL vẫn chạy code cũ.
 * Kiểm tra: mở <URL /exec>?action=ping trên trình duyệt phải thấy "status":"online".
 * =========================================================================
 */

// ID của Google Sheet dùng làm database (đoạn giữa /d/ và /edit trong link Sheet).
// BẮT BUỘC nếu là project Apps Script độc lập (standalone). Để trống nếu script
// được mở từ chính Sheet đó (Extensions > Apps Script).
var SHEET_ID = "1EeT_ub_SRcfYual0Zrri91RdrGzEu9Ns5daZotwSQ-g";

// Tuỳ chọn: ID thư mục Drive có sẵn để lưu ảnh. Nếu điền sai ID sẽ báo lỗi rõ ràng.
var DRIVE_FOLDER_ID = "";

// Nếu DRIVE_FOLDER_ID để trống: tự tìm/tạo thư mục có tên này trong My Drive.
var DRIVE_FOLDER_NAME = "ID Photo Booth Photos";

// Tiền tố mã ảnh. Khác "MP" của Memorial Portrait để Photo Moments tra mã không bị nhầm.
var ID_PREFIX = "IP";

// Cột của sheet Photos. Cột C (DataUrl) là link ảnh để app hiển thị.
var PHOTO_HEADERS = ['ID', 'Timestamp', 'DataUrl', 'Settings', 'DriveLink', 'FileId'];
var COL_ID = 1, COL_TS = 2, COL_URL = 3, COL_SETTINGS = 4, COL_LINK = 5, COL_FILE = 6;

// Giới hạn an toàn cho 1 ô Sheet (Google giới hạn ~50.000 ký tự/ô).
var MAX_CELL_CHARS = 40000;

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

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Chạy hàm này 1 lần trong editor để cấp quyền Sheets + Drive + Properties và tạo sẵn thư mục. */
function authorizeDriveAccess() {
  initSheets();
  var folder = getPhotoFolder();
  PropertiesService.getScriptProperties().getKeys();
  Logger.log("Thư mục lưu ảnh: " + folder.getName() + " (" + folder.getId() + ")");
  Logger.log("Múi giờ script: " + Session.getScriptTimeZone() + " | Mã ảnh hôm nay bắt đầu bằng: " +
    ID_PREFIX + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'ddMMyy'));
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'getPhoto' && e.parameter.id) {
      return jsonOut(getPhoto(e.parameter.id));
    }
    if (action === 'getConfig') {
      return jsonOut(getConfig());
    }
    return jsonOut({ success: true, status: "online", timestamp: new Date().toISOString() });
  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // tryLock trả về false nếu không lấy được khóa: báo bận thay vì chạy không có khóa.
  if (!lock.tryLock(20000)) {
    return jsonOut({ success: false, error: "Máy chủ đang bận, vui lòng thử lại sau vài giây." });
  }

  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var action = data.action;
    var result = { success: false, error: "Unknown action" };

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
    } else if (action === 'ping') {
      result = { success: true, status: "online" };
    }

    return jsonOut(result);
  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function initSheets() {
  var ss = getSpreadsheet();

  var photoSheet = ss.getSheetByName('Photos');
  if (!photoSheet) {
    photoSheet = ss.insertSheet('Photos');
    photoSheet.appendRow(PHOTO_HEADERS);
    photoSheet.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
  } else if (photoSheet.getLastColumn() < PHOTO_HEADERS.length) {
    // Sheet cũ (4 cột): chỉ bổ sung tiêu đề cột DriveLink / FileId, không đụng tới dữ liệu cũ.
    photoSheet.getRange(1, 1, 1, PHOTO_HEADERS.length).setValues([PHOTO_HEADERS]);
    photoSheet.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  if (!ss.getSheetByName('Config')) {
    var configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['Key', 'Value']);
    configSheet.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
  }
}

// ----------------------------- DRIVE -----------------------------

function getPhotoFolder() {
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim() !== '') {
    // Cố ý KHÔNG tự chuyển về My Drive nếu ID sai — báo lỗi để người dùng sửa.
    return DriveApp.getFolderById(DRIVE_FOLDER_ID.trim());
  }
  var it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

// Lưu ảnh base64 (data:image/...;base64,...) thành file <baseName>.png trong thư mục Drive.
function uploadDataUrlToDrive(dataUrl, baseName) {
  var comma = dataUrl.indexOf(',');
  var header = comma > -1 ? dataUrl.substring(0, comma) : '';
  var dataPart = comma > -1 ? dataUrl.substring(comma + 1) : dataUrl;
  var m = /^data:([^;,]+)/.exec(header);
  var mime = m ? m[1] : 'image/png';

  var bytes = Utilities.base64Decode(dataPart);
  var blob = Utilities.newBlob(bytes, mime, baseName + '.png');

  var file = getPhotoFolder().createFile(blob);
  // Cần chia sẻ "bất kỳ ai có link" để app/QR hiển thị được ảnh.
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var id = file.getId();
  return {
    fileId: id,
    viewUrl: "https://drive.google.com/file/d/" + id + "/view",
    imageUrl: "https://drive.google.com/thumbnail?id=" + id + "&sz=w4000"
  };
}

function fileIdFromUrl(url) {
  if (typeof url !== 'string') return '';
  var match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

function trashDriveFile(fileId, fallbackUrl) {
  var id = fileId || fileIdFromUrl(fallbackUrl);
  if (!id) return;
  try {
    DriveApp.getFileById(String(id)).setTrashed(true);
  } catch (e) {
    // File đã bị xoá hoặc không có quyền — bỏ qua.
  }
}

// Tải lại file Drive thành base64 data URL cho client (canvas không bị chặn CORS).
// Dòng cũ còn lưu base64 thô (trước khi có Drive) được trả về nguyên trạng.
function resolveToDataUrl(storedValue, fileId) {
  if (typeof storedValue === 'string' && storedValue.indexOf('data:') === 0) return storedValue;
  var id = fileId || fileIdFromUrl(storedValue);
  if (!id) return storedValue;
  try {
    var blob = DriveApp.getFileById(String(id)).getBlob();
    return 'data:' + (blob.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return storedValue; // Không tải được (đã xoá/mất quyền) — trả link thô để không vỡ hoàn toàn.
  }
}

// ----------------------------- SHEET HELPERS -----------------------------

// Tìm dòng theo ID chỉ bằng cách đọc CỘT A (ID ngắn) — không đọc cả bảng, nên một
// ô hỏng/quá lớn ở cột khác không làm hỏng mọi thao tác.
function findRowById(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, COL_ID, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function readCell(sheet, row, col) {
  try {
    return sheet.getRange(row, col).getValue();
  } catch (e) {
    return '';
  }
}

function parseSettings(value) {
  try {
    return JSON.parse(value || '{}');
  } catch (e) {
    return {};
  }
}

function rowToPhoto(sheet, row) {
  return {
    id: readCell(sheet, row, COL_ID),
    timestamp: readCell(sheet, row, COL_TS),
    dataUrl: readCell(sheet, row, COL_URL),
    driveLink: readCell(sheet, row, COL_LINK),
    fileId: readCell(sheet, row, COL_FILE),
    settings: parseSettings(readCell(sheet, row, COL_SETTINGS))
  };
}

// Bỏ mọi chuỗi base64 (vd: mask) khỏi settings và giữ trong giới hạn ô.
function safeSettingsJson(settings) {
  var json = JSON.stringify(settings || {}, function (k, v) {
    return (typeof v === 'string' && v.indexOf('data:') === 0) ? '[omitted]' : v;
  });
  return json.length > MAX_CELL_CHARS ? '{}' : json;
}

// ----------------------------- PHOTO ID -----------------------------
// Định dạng: ID_PREFIX + ddmmyy + NNN (vd: IP251025001 = ảnh thứ 1 ngày 25/10/2025).
// ddmmyy theo múi giờ của script (đặt Asia/Ho_Chi_Minh), NNN là số thứ tự trong ngày
// (001, 002, ...; quá 999 thì tự dài ra). Chạy trong khóa của doPost nên 2 máy lưu
// cùng lúc không bao giờ nhận trùng số.
function nextPhotoId(sheet) {
  var day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'ddMMyy');
  var prefix = ID_PREFIX + day;
  var re = new RegExp('^' + prefix + '(\\d{3,})$');

  // Số lớn nhất đang có trong Sheet hôm nay (chỉ đọc cột ID).
  var max = 0;
  var last = sheet.getLastRow();
  if (last >= 2) {
    var ids = sheet.getRange(2, COL_ID, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var m = re.exec(String(ids[i][0]));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  }

  // Bộ đếm lưu riêng để KHÔNG dùng lại số của ảnh đã bị xoá
  // (mã QR đã in ra không được trỏ nhầm sang ảnh khác).
  var props = PropertiesService.getScriptProperties();
  var key = 'PHOTO_SEQ_' + day;
  max = Math.max(max, parseInt(props.getProperty(key) || '0', 10));

  var next = max + 1;
  props.setProperty(key, String(next));

  // Dọn bộ đếm của các ngày trước cho gọn.
  var all = props.getKeys();
  for (var k = 0; k < all.length; k++) {
    if (all[k].indexOf('PHOTO_SEQ_') === 0 && all[k] !== key) props.deleteProperty(all[k]);
  }

  var seq = String(next);
  while (seq.length < 3) seq = '0' + seq;
  return prefix + seq;
}

// Trả lại số vừa cấp nếu lưu thất bại, để không tạo "lỗ hổng" trong dãy số thứ tự.
function releasePhotoId(id) {
  var m = new RegExp('^' + ID_PREFIX + '(\\d{6})(\\d{3,})$').exec(String(id));
  if (!m) return;
  var props = PropertiesService.getScriptProperties();
  var key = 'PHOTO_SEQ_' + m[1];
  var n = parseInt(m[2], 10);
  if (parseInt(props.getProperty(key) || '0', 10) === n) props.setProperty(key, String(n - 1));
}

// ----------------------------- ACTIONS -----------------------------

function savePhoto(data) {
  var sheet = getSpreadsheet().getSheetByName('Photos');
  // Ảnh mới (autoId hoặc chưa có ID) => cấp mã mới. Có ID sẵn => ghi đè ảnh đó
  // (lưu lại cùng 1 ảnh, hoặc ID cố định như mã phiên điện thoại IDP_...).
  var generated = !!(data.autoId || !data.id);
  var id = generated ? nextPhotoId(sheet) : String(data.id);
  var result = savePhotoRow(sheet, id, data);
  if (!result.success && generated) releasePhotoId(id);
  return result;
}

function savePhotoRow(sheet, id, data) {
  var dataUrl = data.dataUrl;

  if (typeof dataUrl !== 'string' || dataUrl === '') {
    return { success: false, error: 'Thiếu dữ liệu ảnh.' };
  }

  var imageUrl = dataUrl, viewUrl = '', fileId = '';

  if (dataUrl.indexOf('data:') === 0) {
    // Ảnh thô -> bắt buộc phải lưu được lên Drive. Lỗi Drive => báo lỗi,
    // TUYỆT ĐỐI không ghi base64 vào Sheet.
    try {
      var up = uploadDataUrlToDrive(dataUrl, id);
      imageUrl = up.imageUrl; viewUrl = up.viewUrl; fileId = up.fileId;
    } catch (driveErr) {
      return { success: false, error: 'Không lưu được ảnh lên Drive: ' + driveErr.toString() };
    }
  } else if (dataUrl.length > MAX_CELL_CHARS) {
    return { success: false, error: 'Đường dẫn ảnh quá dài.' };
  }

  try {
    // Đã upload xong mới xoá bản cũ cùng ID, nên upload lỗi không làm mất ảnh cũ.
    var existing = findRowById(sheet, id);
    if (existing > 0) {
      trashDriveFile(readCell(sheet, existing, COL_FILE), readCell(sheet, existing, COL_URL));
      sheet.deleteRow(existing);
    }

    sheet.appendRow([
      id,
      data.timestamp || new Date().getTime(),
      imageUrl,
      safeSettingsJson(data.settings),
      viewUrl,
      fileId
    ]);
  } catch (sheetErr) {
    trashDriveFile(fileId, ''); // không để lại file mồ côi trên Drive
    return { success: false, error: 'Không ghi được vào Sheet: ' + sheetErr.toString() };
  }

  return { success: true, id: id, driveLink: viewUrl, fileId: fileId };
}

function getPhoto(id) {
  var sheet = getSpreadsheet().getSheetByName('Photos');
  var row = findRowById(sheet, id);
  if (row < 0) return { success: false, error: 'Not found' };
  var photo = rowToPhoto(sheet, row);
  photo.dataUrl = resolveToDataUrl(photo.dataUrl, photo.fileId);
  return { success: true, photo: photo };
}

function listPhotos() {
  var sheet = getSpreadsheet().getSheetByName('Photos');
  var last = sheet.getLastRow();
  var photos = [];
  if (last < 2) return { success: true, photos: photos };

  // Tối đa 50 ảnh gần nhất. Thử đọc theo lô cho nhanh; nếu lỗi thì đọc từng dòng.
  var first = Math.max(2, last - 49);
  var rows = null;
  try {
    rows = sheet.getRange(first, 1, last - first + 1, PHOTO_HEADERS.length).getValues();
  } catch (e) {
    rows = null;
  }

  for (var r = last; r >= first; r--) {
    if (rows) {
      var v = rows[r - first];
      photos.push({
        id: v[COL_ID - 1], timestamp: v[COL_TS - 1], dataUrl: v[COL_URL - 1],
        driveLink: v[COL_LINK - 1], fileId: v[COL_FILE - 1], settings: parseSettings(v[COL_SETTINGS - 1])
      });
    } else {
      photos.push(rowToPhoto(sheet, r));
    }
  }
  return { success: true, photos: photos };
}

function deletePhoto(data) {
  var sheet = getSpreadsheet().getSheetByName('Photos');
  var row = findRowById(sheet, data.id);
  if (row < 0) return { success: false };
  trashDriveFile(readCell(sheet, row, COL_FILE), readCell(sheet, row, COL_URL));
  sheet.deleteRow(row);
  return { success: true };
}

function saveConfig(config) {
  var sheet = getSpreadsheet().getSheetByName('Config');
  sheet.clear();
  sheet.appendRow(['Key', 'Value']);
  sheet.appendRow(['app_settings', JSON.stringify(config || {})]);
  return { success: true };
}

function getConfig() {
  var sheet = getSpreadsheet().getSheetByName('Config');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == 'app_settings') {
      try {
        return { success: true, config: JSON.parse(rows[i][1]) };
      } catch (e) {}
    }
  }
  return { success: false };
}
