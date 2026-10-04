/**
 * Factory Issue Capture - Google Apps Script backend
 * วางโค้ดนี้ใน Extensions > Apps Script ของ Google Sheet แล้วรัน setup() 1 ครั้ง
 */
const ADMIN_PIN = "721909"; // *** เปลี่ยนก่อนใช้งานจริง ***
const LINE_NOTIFY_TOKEN = ""; // *** ใส่ LINE Notify Token หรือตั้งค่าผ่านหน้าเว็บ / Script Properties ***
const COLS = ["id","created","area","type","sev","spot","detail","who","status","closedAt","fixMethod","fixBy","owner","due","photo"];
const FREE = ["status","closedAt","fixMethod","fixBy"]; // ทุกคนแก้ได้ (ปิดงาน/เปิดงานใหม่)
const DEFAULT_CATS = [
  "QC ไลน์ผลิต: งานเสีย, สีเพี้ยน, รอยขีดข่วน, ขนาดไม่ตรง",
  "เครื่องจักร: เครื่องหยุด, เครื่องขัดข้อง, อุปกรณ์ชำรุด, น้ำมัน/ลมรั่ว",
  "สโตร์: วัตถุดิบเสียหาย, ไม่ตรงสเปก, ของขาด, ป้ายผิด/ปนกัน",
  "ความปลอดภัย: จุดเสี่ยงอันตราย, อุปกรณ์ PPE ชำรุด, เกือบเกิดอุบัติเหตุ, สารเคมีรั่ว",
  "สิ่งแวดล้อม: น้ำรั่ว, ฝุ่น, เสียงดังผิดปกติ, ไฟฟ้า/แสงสว่าง",
  "อื่น ๆ: อื่น ๆ"
].join("\n");

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const d = ss.getSheetByName("Data") || ss.insertSheet("Data");
  d.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold");
  d.setFrozenRows(1);
  d.getRange("B2:B").setNumberFormat("yyyy-mm-dd hh:mm");
  d.getRange("J2:J").setNumberFormat("yyyy-mm-dd hh:mm");
  const c = ss.getSheetByName("Config") || ss.insertSheet("Config");
  if (!c.getRange("A1").getValue()) c.getRange("A1").setValue(DEFAULT_CATS);
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("FOLDER")) p.setProperty("FOLDER", DriveApp.createFolder("FactoryIssuePhotos").getId());
  buildDashboard_(ss);
}

function buildDashboard_(ss) {
  let s = ss.getSheetByName("Dashboard");
  if (s) ss.deleteSheet(s);
  s = ss.insertSheet("Dashboard", 0);
  const R = c => "Data!" + c + "$2:" + c + "$5000";
  s.getRange("A1").setValue("📊 Factory Issue Dashboard").setFontSize(16).setFontWeight("bold");
  s.getRange("A3:B8").setFormulas([
    ["ทั้งหมด", "=COUNTA(" + R("A") + ")"],
    ["Open", '=COUNTIF(' + R("I") + ',"Open")'],
    ["Progress", '=COUNTIF(' + R("I") + ',"Progress")'],
    ["Closed", '=COUNTIF(' + R("I") + ',"Closed")'],
    ["อัตราปิดงาน", "=IF(B3=0,0,B6/B3)"],
    ["เวลาปิดเฉลี่ย (ชม.)", '=IFERROR(SUMPRODUCT((' + R("I") + '="Closed")*(' + R("J") + '-' + R("B") + '))/COUNTIF(' + R("I") + ',"Closed")*24,0)']
  ]);
  s.getRange("B7").setNumberFormat("0%");
  s.getRange("B8").setNumberFormat("0.0");
  s.getRange("A10:B10").setValues([["พื้นที่", "จำนวน"]]).setFontWeight("bold");
  s.getRange("A11").setFormula('=IFERROR(SORT(UNIQUE(FILTER(' + R("C") + ',' + R("C") + '<>""))),"")');
  s.getRange("B11").setFormula('=ARRAYFORMULA(IF(A11:A30="","",COUNTIF(' + R("C") + ',A11:A30)))');
  s.getRange("D10:E10").setValues([["ประเภทปัญหา", "จำนวน"]]).setFontWeight("bold");
  s.getRange("D11").setFormula('=IFERROR(SORT(UNIQUE(FILTER(' + R("D") + ',' + R("D") + '<>""))),"")');
  s.getRange("E11").setFormula('=ARRAYFORMULA(IF(D11:D40="","",COUNTIF(' + R("D") + ',D11:D40)))');
  s.getRange("G10:H10").setValues([["ความเร่งด่วน", "จำนวน"]]).setFontWeight("bold");
  s.getRange("G11:H13").setFormulas([
    ["ปกติ", '=COUNTIF(' + R("E") + ',G11)'],
    ["ด่วน", '=COUNTIF(' + R("E") + ',G12)'],
    ["อันตราย", '=COUNTIF(' + R("E") + ',G13)']
  ]);
  s.setColumnWidth(1, 170); s.setColumnWidth(4, 170); s.setColumnWidth(7, 120);
  s.insertChart(s.newChart().setChartType(Charts.ChartType.PIE)
    .addRange(s.getRange("A4:B6")).setPosition(16, 1, 0, 0).setOption("title", "สถานะงาน").build());
  s.insertChart(s.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(s.getRange("A10:B20")).setPosition(16, 5, 0, 0).setOption("title", "ปัญหาแยกตามพื้นที่").build());
}

/* ---------- Web API ---------- */
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data"); }

function toCell_(c, v) {
  if (c === "created" || c === "closedAt") return v ? new Date(Number(v)) : "";
  v = v == null ? "" : String(v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? " " + v : v; // กันสูตรแทรกในชีต
}

function doGet() {
  const v = sheet_().getDataRange().getValues().slice(1).filter(r => r[0]);
  const issues = v.map(r => {
    const o = {};
    COLS.forEach((c, i) => {
      let x = r[i];
      if (x instanceof Date) x = x.getTime();
      o[c] = (x === "" || x == null) ? ((c === "created" || c === "closedAt") ? 0 : "") : x;
    });
    return o;
  });
  const cfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
  const cats = String(cfg ? cfg.getRange("A1").getValue() || "" : "");
  const p = PropertiesService.getScriptProperties();
  const lineToken = p.getProperty("LINE_NOTIFY_TOKEN") || (cfg ? String(cfg.getRange("B1").getValue() || "") : "");
  return out_({ issues: issues, cats: cats, lineToken: lineToken });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    const pinOk = b.pin === ADMIN_PIN;
    const sh = sheet_();
    const findRow = id => {
      const n = Math.max(sh.getLastRow() - 1, 1);
      const k = sh.getRange(2, 1, n, 1).getValues().map(r => r[0]).indexOf(id);
      return k < 0 ? -1 : k + 2;
    };
    switch (b.action) {
      case "checkPin":
        return out_(pinOk ? { ok: true } : { error: "pin" });
      case "add": {
        const i = b.issue || {};
        i.id = Utilities.getUuid().slice(0, 8);
        i.status = "Open"; i.closedAt = 0; i.created = Date.now();
        if (!String(i.who || "").trim()) return out_({ error: "who_required" });
        sh.getRange(sh.getLastRow() + 1, 1, 1, COLS.length).setValues([COLS.map(c => toCell_(c, i[c]))]);

        // Check if the new issue's 'sev' is 'อันตราย' and if a valid LINE token exists
        const lineToken = PropertiesService.getScriptProperties().getProperty("LINE_NOTIFY_TOKEN") || 
          String(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config").getRange("B1").getValue() || "") ||
          LINE_NOTIFY_TOKEN;

        if (String(i.sev || "").trim() === "อันตราย" && lineToken && String(lineToken).trim() !== "") {
          try {
            const dt = Utilities.formatDate(new Date(i.created), "Asia/Bangkok", "dd/MM/yyyy HH:mm");
            const lineMsg = "\n🚨 [แจ้งเตือนเหตุอันตรายเร่งด่วน]\n" +
              "━━━━━━━━━━━━━━━━━━\n" +
              "🆔 รหัสปัญหา (ID): #" + i.id + "\n" +
              "🔴 ระดับความรุนแรง: " + i.sev + "\n" +
              "📍 พื้นที่: " + (i.area || "-") + "\n" +
              "🔧 จุดที่พบ: " + (i.spot || "-") + "\n" +
              "⚠️ ประเภทปัญหา: " + (i.type || "-") + "\n" +
              "📝 รายละเอียดปัญหา: " + (i.detail || "-") + "\n" +
              "👤 ผู้แจ้ง: " + (i.who || "-") + "\n" +
              "⏰ เวลาแจ้ง: " + dt + " น.\n" +
              "━━━━━━━━━━━━━━━━━━\n" +
              "⚠️ กรุณาเข้าตรวจสอบและระงับเหตุโดยทันที!";

            const payload = { message: lineMsg };
            if (i.photo && String(i.photo).startsWith("http")) {
              payload.imageThumbnail = i.photo;
              payload.imageFullsize = i.photo;
            }

            // Use UrlFetchApp to send POST request to LINE Notify API with issue details
            UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
              method: "post",
              headers: { "Authorization": "Bearer " + String(lineToken).trim() },
              payload: payload,
              muteHttpExceptions: true
            });
          } catch(errLine) {
            Logger.log("LINE Notify UrlFetchApp error: " + errLine);
          }
        }
        return out_({ ok: true, id: i.id });
      }
      case "saveLineToken": {
        if (!pinOk) return out_({ error: "pin" });
        const token = String(b.token || "").trim();
        PropertiesService.getScriptProperties().setProperty("LINE_NOTIFY_TOKEN", token);
        const cfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
        if (cfg) cfg.getRange("B1").setValue(token);
        return out_({ ok: true });
      }
      case "testLineNotify": {
        const token = String(b.token || "").trim() || PropertiesService.getScriptProperties().getProperty("LINE_NOTIFY_TOKEN");
        if (!token) return out_({ error: "no_token" });
        const testIssue = {
          id: "TEST-01",
          area: "พื้นที่ทดสอบโรงงาน",
          spot: "จุดตรวจสัญญาณแจ้งเตือน",
          type: "ความปลอดภัย: ทดสอบการเชื่อมต่อ LINE Notify",
          detail: "ทดสอบการส่งข้อความแจ้งเตือนปัญหาระดับอันตรายผ่าน Google Apps Script สำเร็จ!",
          who: b.who || "ผู้ดูแลระบบ",
          created: Date.now()
        };
        const dt = Utilities.formatDate(new Date(testIssue.created), "Asia/Bangkok", "dd/MM/yyyy HH:mm");
        const msg = "\n🚨 [แจ้งเตือนเหตุอันตรายเร่งด่วน]\n" +
          "━━━━━━━━━━━━━━━━━━\n" +
          "🆔 รหัสปัญหา (ID): #" + testIssue.id + "\n" +
          "🔴 ระดับความรุนแรง: อันตราย\n" +
          "📍 พื้นที่: " + testIssue.area + "\n" +
          "🔧 จุดที่พบ: " + testIssue.spot + "\n" +
          "⚠️ ประเภทปัญหา: " + testIssue.type + "\n" +
          "📝 รายละเอียดปัญหา: " + testIssue.detail + "\n" +
          "👤 ผู้แจ้ง: " + testIssue.who + "\n" +
          "⏰ เวลาแจ้ง: " + dt + " น.\n" +
          "━━━━━━━━━━━━━━━━━━\n" +
          "⚠️ การเชื่อมต่อสำเร็จ!";

        try {
          const res = UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
            method: "post",
            headers: { "Authorization": "Bearer " + token },
            payload: { message: msg },
            muteHttpExceptions: true
          });
          return out_({ ok: res.getResponseCode() === 200 });
        } catch(e) {
          return out_({ error: String(e) });
        }
      }
      case "update": {
        const row = findRow(b.id);
        if (row < 0) return out_({ error: "notfound" });
        const f = b.fields || {};
        const keys = Object.keys(f).filter(x => COLS.indexOf(x) >= 0 && x !== "id");
        if (!pinOk && keys.some(x => FREE.indexOf(x) < 0)) return out_({ error: "pin" });
        keys.forEach(x => sh.getRange(row, COLS.indexOf(x) + 1).setValue(toCell_(x, f[x])));
        return out_({ ok: true });
      }
      case "delete": {
        if (!pinOk) return out_({ error: "pin" });
        (b.ids || []).map(findRow).filter(r => r > 0).sort((x, y) => y - x).forEach(r => sh.deleteRow(r));
        return out_({ ok: true });
      }
      case "saveCats": {
        if (!pinOk) return out_({ error: "pin" });
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config").getRange("A1").setValue(String(b.text || ""));
        return out_({ ok: true });
      }
      case "photo": {
        const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(b.data || "");
        if (!m || b.data.length > 3000000) return out_({ error: "bad_photo" });
        const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], "issue-" + Date.now() + ".jpg");
        const file = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("FOLDER")).createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return out_({ id: file.getId() });
      }
    }
    return out_({ error: "unknown_action" });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
