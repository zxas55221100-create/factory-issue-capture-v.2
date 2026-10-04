import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Lock, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Save, 
  AlertCircle,
  FileCode,
  HardHat,
  RotateCcw,
  Bell,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { LocalStorageService } from '../services/storage.ts';
import { ApiService } from '../services/api.ts';
import { PinModal } from './PinModal.tsx';
import { DEFAULT_ADMIN_PIN, DEFAULT_CATS } from '../types.ts';

interface SettingsModalProps {
  categoriesText: string;
  onCategoriesUpdated: (newCats: string) => void;
  onRefreshData: () => void;
  onResetDemo: () => void;
}

const APPS_SCRIPT_CODE = `/**
 * Factory Issue Capture - Google Apps Script backend
 * วางโค้ดนี้ใน Extensions > Apps Script ของ Google Sheet แล้วรัน setup() 1 ครั้ง
 */
const ADMIN_PIN = "721909"; // *** เปลี่ยนก่อนใช้งานจริง ***
const LINE_NOTIFY_TOKEN = ""; // *** วาง LINE Token ตรงนี้ หรือใส่ผ่านหน้าเว็บแอป ***
const COLS = ["id","created","area","type","sev","spot","detail","who","status","closedAt","fixMethod","fixBy","owner","due","photo"];
const FREE = ["status","closedAt","fixMethod","fixBy"]; // ทุกคนแก้ได้ (ปิดงาน/เปิดงานใหม่)
const DEFAULT_CATS = [
  "QC ไลน์ผลิต: งานเสีย, สีเพี้ยน, รอยขีดข่วน, ขนาดไม่ตรง",
  "เครื่องจักร: เครื่องหยุด, เครื่องขัดข้อง, อุปกรณ์ชำรุด, น้ำมัน/ลมรั่ว",
  "สโตร์: วัตถุดิบเสียหาย, ไม่ตรงสเปก, ของขาด, ป้ายผิด/ปนกัน",
  "ความปลอดภัย: จุดเสี่ยงอันตราย, อุปกรณ์ PPE ชำรุด, เกือบเกิดอุบัติเหตุ, สารเคมีรั่ว",
  "สิ่งแวดล้อม: น้ำรั่ว, ฝุ่น, เสียงดังผิดปกติ, ไฟฟ้า/แสงสว่าง",
  "อื่น ๆ: อื่น ๆ"
].join("\\n");

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

/* ---------- LINE Notify Integration ---------- */
function sendLineNotify_(issue, customToken) {
  const p = PropertiesService.getScriptProperties();
  const cfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
  const token = customToken || p.getProperty("LINE_NOTIFY_TOKEN") || (cfg ? String(cfg.getRange("B1").getValue() || "") : "");
  if (!token) return false;

  const dtStr = Utilities.formatDate(new Date(issue.created || Date.now()), "Asia/Bangkok", "dd/MM/yyyy HH:mm");
  const msg = "\\n🚨 [แจ้งเตือนเหตุอันตรายเร่งด่วน]\\n" +
    "━━━━━━━━━━━━━━━━━━\\n" +
    "🆔 รหัสปัญหา: #" + (issue.id || "-") + "\\n" +
    "🔴 ความเร่งด่วน: อันตราย (Hazardous)\\n" +
    "📍 พื้นที่: " + (issue.area || "-") + "\\n" +
    "🔧 จุดที่พบ: " + (issue.spot || "-") + "\\n" +
    "⚠️ หมวดหมู่: " + (issue.type || "-") + "\\n" +
    "📝 รายละเอียด: " + (issue.detail || "-") + "\\n" +
    "👤 ผู้แจ้ง: " + (issue.who || "-") + "\\n" +
    "⏰ เวลาแจ้ง: " + dtStr + " น.\\n" +
    "━━━━━━━━━━━━━━━━━━\\n" +
    "⚠️ กรุณาเข้าตรวจสอบและระงับเหตุโดยทันที!";

  const payload = { message: msg };
  if (issue.photo && issue.photo.startsWith("http")) {
    payload.imageThumbnail = issue.photo;
    payload.imageFullsize = issue.photo;
  }

  const options = {
    method: "post",
    headers: { "Authorization": "Bearer " + token },
    payload: payload,
    muteHttpExceptions: true
  };
  try {
    const res = UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
    return res.getResponseCode() === 200;
  } catch(e) {
    Logger.log("LINE Notify Error: " + e);
    return false;
  }
}

/* ---------- Web API ---------- */
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data"); }

function toCell_(c, v) {
  if (c === "created" || c === "closedAt") return v ? new Date(Number(v)) : "";
  v = v == null ? "" : String(v).slice(0, 2000);
  return /^[=+\\-@]/.test(v) ? " " + v : v; // กันสูตรแทรกในชีต
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
            const lineMsg = "\\n🚨 [แจ้งเตือนเหตุอันตรายเร่งด่วน]\\n" +
              "━━━━━━━━━━━━━━━━━━\\n" +
              "🆔 รหัสปัญหา (ID): #" + i.id + "\\n" +
              "🔴 ระดับความรุนแรง: " + i.sev + "\\n" +
              "📍 พื้นที่: " + (i.area || "-") + "\\n" +
              "🔧 จุดที่พบ: " + (i.spot || "-") + "\\n" +
              "⚠️ ประเภทปัญหา: " + (i.type || "-") + "\\n" +
              "📝 รายละเอียดปัญหา: " + (i.detail || "-") + "\\n" +
              "👤 ผู้แจ้ง: " + (i.who || "-") + "\\n" +
              "⏰ เวลาแจ้ง: " + dt + " น.\\n" +
              "━━━━━━━━━━━━━━━━━━\\n" +
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
        const ok = sendLineNotify_(testIssue, token);
        return out_({ ok: ok });
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
        const m = /^data:(image\\/[a-z+]+);base64,(.+)$/.exec(b.data || "");
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
}`;

export const BACKEND_ADD_CODE_SNIPPET = `// -------------------------------------------------------------
// โค้ดใน doPost(e) -> switch (b.action) -> case "add":
// ตรวจสอบความรุนแรงของปัญหา หากระดับเป็น 'อันตราย' 
// ให้เรียกใช้ URL Fetch ไปยัง LINE Notify API พร้อมแนบรายละเอียดปัญหาและ ID ของปัญหา
// -------------------------------------------------------------
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
      const lineMsg = "\\n🚨 [แจ้งเตือนเหตุอันตรายเร่งด่วน]\\n" +
        "━━━━━━━━━━━━━━━━━━\\n" +
        "🆔 รหัสปัญหา (ID): #" + i.id + "\\n" +
        "🔴 ระดับความรุนแรง: " + i.sev + "\\n" +
        "📍 พื้นที่: " + (i.area || "-") + "\\n" +
        "🔧 จุดที่พบ: " + (i.spot || "-") + "\\n" +
        "⚠️ ประเภทปัญหา: " + (i.type || "-") + "\\n" +
        "📝 รายละเอียดปัญหา: " + (i.detail || "-") + "\\n" +
        "👤 ผู้แจ้ง: " + (i.who || "-") + "\\n" +
        "⏰ เวลาแจ้ง: " + dt + " น.\\n" +
        "━━━━━━━━━━━━━━━━━━\\n" +
        "⚠️ กรุณาเข้าตรวจสอบและระงับเหตุโดยทันที!";

      const payload = { message: lineMsg };
      if (i.photo && String(i.photo).startsWith("http")) {
        payload.imageThumbnail = i.photo;
        payload.imageFullsize = i.photo;
      }

      // Use UrlFetchApp to send a POST request to the LINE Notify API with the issue details
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
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  categoriesText,
  onCategoriesUpdated,
  onRefreshData,
  onResetDemo,
}) => {
  const [webAppUrl, setWebAppUrl] = useState(() => LocalStorageService.getWebAppUrl());
  const [catsInput, setCatsInput] = useState(categoriesText);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'snippet' | 'full'>('snippet');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // LINE Notify State
  const [lineToken, setLineToken] = useState(() => LocalStorageService.getLineToken());
  const [showLineToken, setShowLineToken] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineMsg, setLineMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPinModalOpenForLine, setIsPinModalOpenForLine] = useState(false);

  // PIN settings
  const [currentPin, setCurrentPin] = useState(() => LocalStorageService.getAdminPin());
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ ok: boolean; message: string } | null>(null);

  // Category save PIN requirement
  const [isPinModalOpenForCats, setIsPinModalOpenForCats] = useState(false);
  const [catSaveMsg, setCatSaveMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSaveUrl = () => {
    LocalStorageService.setWebAppUrl(webAppUrl);
    setTestResult(null);
    onRefreshData();
  };

  const handleTestConnection = async () => {
    if (!webAppUrl) {
      setTestResult({ ok: false, message: 'กรุณากรอก Google Apps Script Web App URL ก่อนทดสอบ' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(webAppUrl, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.issues)) {
        setTestResult({
          ok: true,
          message: `เชื่อมต่อสำเร็จ! ดึงข้อมูลได้ ${data.issues.length} รายการจาก Google Sheet`,
        });
        LocalStorageService.setWebAppUrl(webAppUrl);
        if (data.lineToken) {
          setLineToken(data.lineToken);
          LocalStorageService.setLineToken(data.lineToken);
        }
        onRefreshData();
      } else {
        setTestResult({
          ok: false,
          message: 'ตอบกลับจาก URL แต่รูปแบบข้อมูลไม่ถูกต้อง (ต้องเป็น JSON { issues, cats })',
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: 'เชื่อมต่อไม่สำเร็จ โปรดตรวจสอบว่า Deploy Web App ให้ "Who has access" เป็น "Anyone"',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveCategoriesSubmit = (pin: string) => {
    ApiService.saveCategories(catsInput, pin).then(res => {
      if (res.ok) {
        onCategoriesUpdated(catsInput);
        setCatSaveMsg({ ok: true, message: 'บันทึกประเภทปัญหาลงระบบเรียบร้อย' });
      } else {
        setCatSaveMsg({ ok: false, message: 'รหัส PIN ไม่ถูกต้อง ไม่สามารถบันทึกได้' });
      }
    });
  };

  const handleSaveLineTokenSubmit = (pin: string) => {
    ApiService.saveLineToken(lineToken, pin).then(res => {
      if (res.ok) {
        setLineMsg({ ok: true, message: 'บันทึก LINE Notify Token ลงระบบเรียบร้อยแล้ว' });
      } else {
        setLineMsg({ ok: false, message: 'รหัส PIN ไม่ถูกต้อง ไม่สามารถบันทึก Token ได้' });
      }
    });
  };

  const handleTestLineNotify = async () => {
    if (!lineToken.trim()) {
      setLineMsg({ ok: false, message: 'กรุณากรอก LINE Notify Token ก่อนทดสอบส่งข้อความ' });
      return;
    }

    setIsTestingLine(true);
    setLineMsg(null);

    try {
      const res = await ApiService.testLineNotify(lineToken);
      if (res.ok) {
        setLineMsg({
          ok: true,
          message: 'ส่งข้อความแจ้งเตือนทดสอบไปยังกลุ่ม LINE เรียบร้อย! ตรวจสอบแชท LINE ของคุณได้เลย',
        });
      } else {
        setLineMsg({
          ok: false,
          message: res.error || 'ส่งข้อความไม่สำเร็จ โปรดตรวจสอบความถูกต้องของ Token หรือสิทธิ์ในกลุ่ม LINE',
        });
      }
    } catch {
      setLineMsg({ ok: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง LINE Notify API' });
    } finally {
      setIsTestingLine(false);
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMsg({ ok: false, message: 'รหัส PIN ต้องมีความยาวอย่างน้อย 4 ตัวเลข' });
      return;
    }
    LocalStorageService.setAdminPin(newPin);
    setCurrentPin(newPin);
    setNewPin('');
    setPinChangeMsg({ ok: true, message: 'เปลี่ยนรหัส Admin PIN เรียบร้อยแล้ว' });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            การตั้งค่าระบบ & เชื่อมต่อ Google Sheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            เชื่อมต่อกับ Google Apps Script backend เพื่อซิงค์ข้อมูลกับ Google Sheet, Google Drive และแจ้งเตือน LINE Notify
          </p>
        </div>
      </div>

      {/* Section 1: Google Sheet Web App Connection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Google Apps Script Web App URL
            </h2>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1.5 ${
              webAppUrl
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {webAppUrl ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5" />}
            {webAppUrl ? 'ตั้งค่า URL แล้ว' : 'ยังไม่ได้เชื่อมต่อ (ใช้โหมด Offline LocalStorage)'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          เมื่อใส่ Web App URL ข้อมูลการแจ้งปัญหา รูปภาพ และการปิดงานจะถูกซิงค์ตรงไปยัง Google Sheet และโฟลเดอร์ Google Drive ทันที
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={webAppUrl}
            onChange={e => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="flex-1 text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 font-mono"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveUrl}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึก URL
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrl}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              ทดสอบเชื่อมต่อ
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              testResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {testResult.ok ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Section 2: LINE Notify Integration for Hazardous Issues */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#06C755] flex items-center justify-center text-white shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                LINE Notify แจ้งเตือนเหตุด่วน (ระดับ 'อันตราย')
              </h2>
              <span className="text-[11px] text-slate-500">
                ส่งข้อความเข้ากลุ่ม LINE อัตโนมัติทันทีที่พบความผิดปกติระดับอันตราย
              </span>
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1.5 ${
              lineToken
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {lineToken ? 'เปิดใช้งานแจ้งเตือน LINE แล้ว' : 'ยังไม่ได้ระบุ Token'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-2">
          <p>
            <strong>การทำงาน:</strong> เมื่อมีผู้บันทึกปัญหาและเลือกความเร่งด่วนเป็น <strong>🔴 "อันตราย"</strong> ระบบ Google Apps Script จะส่งข้อความแจ้งเตือนพร้อมรหัสปัญหา, พื้นที่, จุดติดตั้ง, ผู้แจ้ง, และรูปภาพหน้างาน ไปยังกลุ่ม LINE ที่ผูก Token ไว้ทันที
          </p>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
            <span>วิธีขอ Token:</span>
            <a
              href="https://notify-bot.line.me/my/"
              target="_blank"
              rel="noreferrer"
              className="text-[#06C755] hover:underline font-semibold inline-flex items-center gap-0.5"
            >
              notify-bot.line.me/my
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>(ล็อกอินด้วย LINE &gt; ออก Token &gt; เลือกกลุ่มช่าง/ความปลอดภัย &gt; นำ Token มาใส่ด้านล่าง)</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              LINE Notify Token
            </label>
            <div className="relative">
              <input
                type={showLineToken ? 'text' : 'password'}
                value={lineToken}
                onChange={e => setLineToken(e.target.value)}
                placeholder="วาง Token เช่น l7KqW8G..."
                className="w-full text-xs font-mono py-2 pl-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#06C755] outline-none text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowLineToken(!showLineToken)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showLineToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestLineNotify}
              disabled={isTestingLine || !lineToken}
              className="px-3.5 py-2 text-xs font-semibold bg-[#06C755] hover:bg-[#05b34c] disabled:opacity-50 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingLine ? 'animate-pulse' : ''}`} />
              {isTestingLine ? 'กำลังทดสอบส่ง...' : 'ทดสอบส่งแจ้งเตือนเข้า LINE'}
            </button>

            <button
              type="button"
              onClick={() => setIsPinModalOpenForLine(true)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              บันทึก LINE Token (ยืนยัน PIN)
            </button>
          </div>

          {lineMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                lineMsg.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {lineMsg.ok ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{lineMsg.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Step-by-Step Setup Guide with Updated Code */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              โค้ด Google Apps Script (พร้อมระบบ LINE Notify อัตโนมัติ)
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Apps Script'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-2">
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
            <span className="font-mono text-amber-400 font-bold block">ขั้นตอนที่ 1</span>
            <p className="text-slate-300">
              สร้าง Google Sheet ใหม่ แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong>
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
            <span className="font-mono text-amber-400 font-bold block">ขั้นตอนที่ 2</span>
            <p className="text-slate-300">
              วางโค้ดที่คัดลอกลงไป จากนั้นเลือกรันฟังก์ชัน <strong>setup()</strong> 1 ครั้ง
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
            <span className="font-mono text-amber-400 font-bold block">ขั้นตอนที่ 3</span>
            <p className="text-slate-300">
              กด <strong>ทำให้ใช้งานได้ (Deploy) &gt; การปรับใช้ใหม่ &gt; เว็บแอป (Web app)</strong>
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
            <span className="font-mono text-amber-400 font-bold block">ขั้นตอนที่ 4</span>
            <p className="text-slate-300">
              ตั้งค่าสิทธิ์เข้าถึงเป็น <strong>ทุกคน (Anyone)</strong> แล้วนำ Web App URL มาใส่ในช่องด้านบน
            </p>
          </div>
        </div>

        {/* Code View Tabs */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setActiveCodeTab('snippet')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCodeTab === 'snippet'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 เฉพาะฟังก์ชัน 'add' (ตรวจระดับอันตราย & URL Fetch)
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('full')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCodeTab === 'full'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📄 โค้ดเต็มทั้งหมด
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeCodeTab === 'snippet') {
                  navigator.clipboard.writeText(BACKEND_ADD_CODE_SNIPPET);
                  setCopiedSnippet(true);
                  setTimeout(() => setCopiedSnippet(false), 2500);
                } else {
                  handleCopyCode();
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto"
            >
              {(activeCodeTab === 'snippet' ? copiedSnippet : copiedCode) ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>
                {(activeCodeTab === 'snippet' ? copiedSnippet : copiedCode)
                  ? 'คัดลอกเรียบร้อยแล้ว!'
                  : activeCodeTab === 'snippet'
                  ? 'คัดลอกเฉพาะฟังก์ชัน add'
                  : 'คัดลอกโค้ดเต็มไฟล์'}
              </span>
            </button>
          </div>

          <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
            <code>{activeCodeTab === 'snippet' ? BACKEND_ADD_CODE_SNIPPET : APPS_SCRIPT_CODE}</code>
          </pre>
        </div>
      </div>

      {/* Section 4: Categories Configuration (Config Sheet A1) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              หมวดหมู่และประเภทปัญหาโรงงาน (Config Sheet A1)
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          จัดรูปแบบเป็น <code>ชื่อหมวดหมู่หลัก: ข้อย่อย 1, ข้อย่อย 2, ข้อย่อย 3</code> บรรทัดละ 1 หมวดหมู่ (การแก้ไขต้องใช้ Admin PIN)
        </p>

        <textarea
          rows={7}
          value={catsInput}
          onChange={e => setCatsInput(e.target.value)}
          className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed text-slate-800 bg-slate-50/50"
        />

        {catSaveMsg && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 border ${
              catSaveMsg.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {catSaveMsg.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{catSaveMsg.message}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsPinModalOpenForCats(true)}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            บันทึกประเภทปัญหา (ยืนยัน PIN)
          </button>
        </div>
      </div>

      {/* Section 5: Admin PIN Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900">
            ระบบจัดการสิทธิ์ Admin PIN
          </h2>
        </div>

        <p className="text-xs text-slate-500">
          รหัส PIN ใช้สำหรับปกป้องการแก้ไขข้อมูลหลัก การลบข้อมูลปัญหา และการตั้งค่าหมวดหมู่ (รหัสเริ่มต้นของระบบคือ <strong>721909</strong>)
        </p>

        <form onSubmit={handleChangePin} className="max-w-md space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              เปลี่ยนรหัส Admin PIN ใหม่
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={8}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="ระบุตัวเลข 4-8 หลัก"
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg whitespace-nowrap"
              >
                เปลี่ยนรหัส PIN
              </button>
            </div>
          </div>

          {pinChangeMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 border ${
                pinChangeMsg.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {pinChangeMsg.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{pinChangeMsg.message}</span>
            </div>
          )}
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">ต้องการรีเซ็ตข้อมูลทดสอบโรงงานกลับสู่ค่าเริ่มต้น?</span>
          <button
            type="button"
            onClick={onResetDemo}
            className="text-xs text-slate-600 hover:text-red-600 inline-flex items-center gap-1 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            รีเซ็ตข้อมูลจำลองเริ่มต้น (Reset Demo Data)
          </button>
        </div>
      </div>

      {/* PinModal for Category Saving */}
      <PinModal
        isOpen={isPinModalOpenForCats}
        title="ยืนยัน PIN เพื่อบันทึกหมวดหมู่ปัญหา"
        description="การแก้ไขรายชื่อหมวดหมู่จะส่งผลต่อการเลือกประเภทปัญหาของผู้แจ้งทุกคน"
        onClose={() => setIsPinModalOpenForCats(false)}
        onSuccess={pin => {
          setIsPinModalOpenForCats(false);
          handleSaveCategoriesSubmit(pin);
        }}
      />

      {/* PinModal for LINE Notify Token Saving */}
      <PinModal
        isOpen={isPinModalOpenForLine}
        title="ยืนยัน PIN เพื่อบันทึก LINE Notify Token"
        description="การบันทึก Token จะทำให้ระบบส่งข้อความแจ้งเตือนปัญหาระดับอันตรายไปยังกลุ่ม LINE ดังกล่าวทันที"
        onClose={() => setIsPinModalOpenForLine(false)}
        onSuccess={pin => {
          setIsPinModalOpenForLine(false);
          handleSaveLineTokenSubmit(pin);
        }}
      />
    </div>
  );
};
