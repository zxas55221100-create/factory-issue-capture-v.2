export interface Issue {
  id: string;
  created: number;
  area: string;
  type: string;
  sev: 'ปกติ' | 'ด่วน' | 'อันตราย' | string;
  spot: string;
  detail: string;
  who: string;
  status: 'Open' | 'Progress' | 'Closed' | string;
  closedAt: number;
  fixMethod: string;
  fixBy: string;
  owner: string;
  due: string;
  photo: string;
}

export const COLS = [
  'id',
  'created',
  'area',
  'type',
  'sev',
  'spot',
  'detail',
  'who',
  'status',
  'closedAt',
  'fixMethod',
  'fixBy',
  'owner',
  'due',
  'photo',
] as const;

export const FREE_FIELDS = ['status', 'closedAt', 'fixMethod', 'fixBy'] as const;

export const DEFAULT_ADMIN_PIN = '721909';

export const DEFAULT_CATS = [
  'QC ไลน์ผลิต: งานเสีย, สีเพี้ยน, รอยขีดข่วน, ขนาดไม่ตรง',
  'เครื่องจักร: เครื่องหยุด, เครื่องขัดข้อง, อุปกรณ์ชำรุด, น้ำมัน/ลมรั่ว',
  'สโตร์: วัตถุดิบเสียหาย, ไม่ตรงสเปก, ของขาด, ป้ายผิด/ปนกัน',
  'ความปลอดภัย: จุดเสี่ยงอันตราย, อุปกรณ์ PPE ชำรุด, เกือบเกิดอุบัติเหตุ, สารเคมีรั่ว',
  'สิ่งแวดล้อม: น้ำรั่ว, ฝุ่น, เสียงดังผิดปกติ, ไฟฟ้า/แสงสว่าง',
  'อื่น ๆ: อื่น ๆ',
].join('\n');

export const DEFAULT_AREAS = [
  'ไลน์ผลิต 1 (Main Assembly)',
  'ไลน์ผลิต 2 (Sub-assembly)',
  'ไลน์ฉีดพลาสติก (Molding)',
  'แผนกพ่นสี (Coating)',
  'คลังวัตถุดิบ (Raw Material Store)',
  'คลังสินค้าสำเร็จรูป (FG Warehouse)',
  'แผนกซ่อมบำรุง (Maintenance Workshop)',
  'ห้องควบคุมเครื่องจักร (Control Room)',
  'พื้นที่ขนถ่ายสินค้า (Loading Dock)',
  'พื้นที่ส่วนกลาง / ทางเดินหลัก',
];

export interface CategoryGroup {
  groupName: string;
  subTypes: string[];
}

export function parseCategories(catString: string): CategoryGroup[] {
  if (!catString) return [];
  const lines = catString.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      return {
        groupName: line,
        subTypes: [line],
      };
    }
    const groupName = line.slice(0, colonIdx).trim();
    const subs = line
      .slice(colonIdx + 1)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return {
      groupName,
      subTypes: subs.length > 0 ? subs : [groupName],
    };
  });
}
