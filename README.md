# Factory Issue Capture & Dashboard 🏭

ระบบบันทึกและติดตามปัญหาหน้างานในโรงงาน (Factory Issue Capture & Dashboard) พร้อมระบบถ่ายภาพหน้างาน, ปิดงานซ่อม, ตรวจสอบสิทธิ์ด้วย Admin PIN, เชื่อมต่อกับ Google Sheets และแจ้งเตือน LINE Notify อัตโนมัติเมื่อเกิดเหตุอันตราย

---

## 🚀 การ Deploy ขึ้น Vercel (Step-by-Step)

โปรเจกต์นี้สร้างด้วย **React + Vite + TypeScript + Tailwind CSS** ซึ่งรองรับการ Deploy บน Vercel ได้ 100% โดยมีไฟล์ `vercel.json` เตรียมไว้ให้เรียบร้อยแล้ว

### ขั้นตอนการนำขึ้น Vercel:

1. **นำโค้ดขึ้น GitHub**:
   - สร้าง Repository ใหม่บน [GitHub](https://github.com/new)
   - อัปโหลดไฟล์โปรเจกต์ทั้งหมด (ยกเว้น `node_modules` และ `dist`) ขึ้น GitHub

2. **เปิดหน้าแดชบอร์ด Vercel**:
   - เข้าสู่ระบบ [Vercel](https://vercel.com/)
   - กดปุ่ม **"Add New..." > "Project"** หรือเลือก **"Import Git Repository"** จากหน้า New Project ที่แสดงในภาพของคุณ
   - เลือก Repository ที่เพิ่งสร้างขึ้น

3. **ตั้งค่า Build (Vercel จะตรวจจับให้อัตโนมัติ)**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **กดปุ่ม "Deploy"**:
   - รอ Vercel ทำการ Build ประมาณ 30-60 วินาที
   - คุณจะได้รับโดเมนเว็บไซต์ฟรีทันที เช่น `https://factory-issue-capture.vercel.app`

---

## ⚙️ การเชื่อมต่อกับ Google Sheets & LINE Notify

1. นำโค้ดจากไฟล์ `backend.gs` ไปวางใน Google Sheet (เมนู **Extensions > Apps Script**)
2. เลือกรันฟังก์ชัน `setup()` 1 ครั้ง เพื่อสร้างตาราง `Data`, `Config`, `Dashboard` และโฟลเดอร์ Google Drive
3. กด **Deploy > New deployment > Web app**:
   - **Execute as**: Me
   - **Who has access**: Anyone (ทุกคน)
4. คัดลอก **Web App URL** ที่ได้ นำมาใส่ในหน้า **"ตั้งค่า & Google Sheet"** ของเว็บแอป
5. ระบุ **LINE Notify Token** เพื่อให้ระบบส่งแจ้งเตือนเหตุด่วนเข้ากลุ่ม LINE เมื่อมีผู้แจ้งปัญหาระดับ *"อันตราย"*
