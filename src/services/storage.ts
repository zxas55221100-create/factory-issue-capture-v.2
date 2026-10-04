import { Issue, DEFAULT_ADMIN_PIN, DEFAULT_CATS } from '../types.ts';

const STORAGE_KEYS = {
  ISSUES: 'factory_issues_data',
  PIN: 'factory_admin_pin',
  WEB_APP_URL: 'factory_web_app_url',
  CATEGORIES: 'factory_categories_config',
  LAST_REPORTER: 'factory_last_reporter',
  LINE_TOKEN: 'factory_line_notify_token',
};

// Seed realistic initial factory issue data for immediate out-of-the-box utility
const INITIAL_DEMO_ISSUES: Issue[] = [
  {
    id: 'a8f190c2',
    created: Date.now() - 3600 * 1000 * 26, // 26 hours ago
    area: 'ไลน์ผลิต 1 (Main Assembly)',
    type: 'เครื่องจักร: เครื่องหยุด, เครื่องขัดข้อง, อุปกรณ์ชำรุด, น้ำมัน/ลมรั่ว',
    sev: 'อันตราย',
    spot: 'หุ่นยนต์เชื่อม Robot-03 แขนกลที่ 2',
    detail: 'มีเสียงกระตุกผิดปกติและท่อแรงดันไฮดรอลิกเริ่มมีคราบน้ำมันรั่วซึม หยุดไลน์ชั่วคราวเพื่อความปลอดภัย',
    who: 'สมชาย ประจำไลน์ 1',
    status: 'Progress',
    closedAt: 0,
    fixMethod: '',
    fixBy: '',
    owner: 'ช่างวิรัช (ซ่อมบำรุง)',
    due: new Date(Date.now() + 3600 * 1000 * 12).toISOString().split('T')[0],
    photo: '',
  },
  {
    id: 'b4e723d1',
    created: Date.now() - 3600 * 1000 * 48, // 2 days ago
    area: 'แผนกพ่นสี (Coating)',
    type: 'QC ไลน์ผลิต: งานเสีย, สีเพี้ยน, รอยขีดข่วน, ขนาดไม่ตรง',
    sev: 'ด่วน',
    spot: 'ตู้อบสี Oven Line B ทางออก',
    detail: 'ชิ้นงานล็อต B-202 พบฟองอากาศและสีหนาเกินสเปก 15 ไมครอน จำนวน 12 ชิ้นจาก 50 ชิ้น',
    who: 'อารีย์ QC Inspector',
    status: 'Open',
    closedAt: 0,
    fixMethod: '',
    fixBy: '',
    owner: 'หัวหน้างานพ่นสี',
    due: new Date(Date.now() + 3600 * 1000 * 24).toISOString().split('T')[0],
    photo: '',
  },
  {
    id: 'c912a450',
    created: Date.now() - 3600 * 1000 * 72, // 3 days ago
    area: 'คลังวัตถุดิบ (Raw Material Store)',
    type: 'สโตร์: วัตถุดิบเสียหาย, ไม่ตรงสเปก, ของขาด, ป้ายผิด/ปนกัน',
    sev: 'ปกติ',
    spot: 'แร็คเก็บวัตถุดิบ Zone R-04',
    detail: 'พาเลทเม็ดพลาสติก PP โดนชนที่ขอบกล่อง ฉีกขาดเล็กน้อย 1 ถุง ซีลเทปและติดป้ายแยกตรวจสอบแล้ว',
    who: 'ประสิทธิ์ สโตร์',
    status: 'Closed',
    closedAt: Date.now() - 3600 * 1000 * 68,
    fixMethod: 'คัดแยกถุงที่ชำรุดชั่งน้ำหนักตรวจสิ่งปลอมปน และย้ายไปจุดเคลมซัพพลายเออร์เรียบร้อย',
    fixBy: 'ประสิทธิ์ สโตร์',
    owner: 'ประสิทธิ์',
    due: new Date(Date.now() - 3600 * 1000 * 48).toISOString().split('T')[0],
    photo: '',
  },
  {
    id: 'd38f5199',
    created: Date.now() - 3600 * 1000 * 8, // 8 hours ago
    area: 'พื้นที่ขนถ่ายสินค้า (Loading Dock)',
    type: 'ความปลอดภัย: จุดเสี่ยงอันตราย, อุปกรณ์ PPE ชำรุด, เกือบเกิดอุบัติเหตุ, สารเคมีรั่ว',
    sev: 'อันตราย',
    spot: 'ประตูทางออก Dock 2 ติดบันไดหนีไฟ',
    detail: 'มีพาเลทเปล่าและเศษสายรัดวางกีดขวางทางหนีไฟฉุกเฉิน และไฟส่องสว่างทางออกกะพริบดับ',
    who: 'นภาพร จป.วิชาชีพ',
    status: 'Open',
    closedAt: 0,
    fixMethod: '',
    fixBy: '',
    owner: 'แผนกโลจิสติกส์ & ซ่อมบำรุง',
    due: new Date(Date.now() + 3600 * 1000 * 6).toISOString().split('T')[0],
    photo: '',
  },
  {
    id: 'e710b284',
    created: Date.now() - 3600 * 1000 * 96, // 4 days ago
    area: 'ไลน์ฉีดพลาสติก (Molding)',
    type: 'สิ่งแวดล้อม: น้ำรั่ว, ฝุ่น, เสียงดังผิดปกติ, ไฟฟ้า/แสงสว่าง',
    sev: 'ด่วน',
    spot: 'เครื่องฉีด Injection No. 4 ระบบ Chiller',
    detail: 'ท่อสายน้ำหล่อเย็น Chiller ข้อต่อหลวม มีน้ำหยดลงพื้นทางเดิน เสี่ยงลื่นล้ม',
    who: 'กิตติศักดิ์ ช่างกะเช้า',
    status: 'Closed',
    closedAt: Date.now() - 3600 * 1000 * 92,
    fixMethod: 'เปลี่ยนโอริงและแคลมป์รัดท่อใหม่ ทำความสะอาดพื้นแห้งสนิท ทดสอบแรงดันน้ำ 30 นาทีไม่พบการรั่วซึม',
    fixBy: 'กิตติศักดิ์ ช่างกะเช้า',
    owner: 'กิตติศักดิ์',
    due: new Date(Date.now() - 3600 * 1000 * 90).toISOString().split('T')[0],
    photo: '',
  },
];

export const LocalStorageService = {
  getIssues(): Issue[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ISSUES);
      if (!data) {
        this.saveIssues(INITIAL_DEMO_ISSUES);
        return INITIAL_DEMO_ISSUES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_ISSUES;
    }
  },

  saveIssues(issues: Issue[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
    } catch (e) {
      console.error('Failed to save issues to localStorage', e);
    }
  },

  getAdminPin(): string {
    return localStorage.getItem(STORAGE_KEYS.PIN) || DEFAULT_ADMIN_PIN;
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(STORAGE_KEYS.PIN, pin.trim());
  },

  getWebAppUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.WEB_APP_URL) || '';
  },

  setWebAppUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.WEB_APP_URL, url.trim());
  },

  getCategories(): string {
    return localStorage.getItem(STORAGE_KEYS.CATEGORIES) || DEFAULT_CATS;
  },

  saveCategories(cats: string): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, cats);
  },

  getLastReporter(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_REPORTER) || '';
  },

  setLastReporter(name: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_REPORTER, name.trim());
  },

  getLineToken(): string {
    return localStorage.getItem(STORAGE_KEYS.LINE_TOKEN) || '';
  },

  setLineToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.LINE_TOKEN, token.trim());
  },

  resetDemoData(): Issue[] {
    this.saveIssues(INITIAL_DEMO_ISSUES);
    this.saveCategories(DEFAULT_CATS);
    this.setAdminPin(DEFAULT_ADMIN_PIN);
    return INITIAL_DEMO_ISSUES;
  },
};
