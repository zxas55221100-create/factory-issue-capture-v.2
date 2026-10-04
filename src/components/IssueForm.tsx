import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Send, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  User, 
  MapPin, 
  Calendar, 
  Wrench,
  Sparkles
} from 'lucide-react';
import { Issue, DEFAULT_AREAS, parseCategories, CategoryGroup } from '../types.ts';
import { ApiService } from '../services/api.ts';
import { LocalStorageService } from '../services/storage.ts';
import { CameraModal } from './CameraModal.tsx';

interface IssueFormProps {
  categoriesText: string;
  onSuccess: (newIssueId: string) => void;
  onCancel: () => void;
}

export const IssueForm: React.FC<IssueFormProps> = ({
  categoriesText,
  onSuccess,
  onCancel,
}) => {
  const [who, setWho] = useState(() => LocalStorageService.getLastReporter() || '');
  const [sev, setSev] = useState<'ปกติ' | 'ด่วน' | 'อันตราย'>('ปกติ');
  const [area, setArea] = useState(DEFAULT_AREAS[0]);
  const [customArea, setCustomArea] = useState('');
  const [spot, setSpot] = useState('');
  const [detail, setDetail] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState(() => {
    // Default วันที่แจ้ง (Today)
    return new Date().toISOString().split('T')[0];
  });
  const [photoData, setPhotoData] = useState<string>('');
  
  // Category selection
  const parsedGroups: CategoryGroup[] = parseCategories(categoriesText);
  const [selectedGroup, setSelectedGroup] = useState<string>(
    parsedGroups[0]?.groupName || 'QC ไลน์ผลิต'
  );
  const [selectedSubtype, setSelectedSubtype] = useState<string>(
    parsedGroups[0]?.subTypes[0] || ''
  );
  const [customTypeDetail, setCustomTypeDetail] = useState('');

  // UI state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const activeGroup = parsedGroups.find(g => g.groupName === selectedGroup) || parsedGroups[0];

  const handleGroupChange = (groupName: string) => {
    setSelectedGroup(groupName);
    const grp = parsedGroups.find(g => g.groupName === groupName);
    if (grp && grp.subTypes.length > 0) {
      setSelectedSubtype(grp.subTypes[0]);
    } else {
      setSelectedSubtype('');
    }
  };

  const handlePhotoCapture = async (base64: string) => {
    setPhotoData(base64);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1200;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhotoData(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!who.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้แจ้งปัญหา');
      return;
    }
    if (!detail.trim()) {
      setErrorMessage('กรุณากรอกรายละเอียดปัญหา');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const finalArea = area === 'OTHER' ? customArea.trim() || 'พื้นที่อื่น ๆ' : area;
      
      // Combine category and subtype: "กลุ่ม: ย่อย"
      let fullType = selectedGroup;
      if (selectedSubtype) {
        fullType = `${selectedGroup}: ${selectedSubtype}`;
      }
      if (customTypeDetail.trim()) {
        fullType += ` (${customTypeDetail.trim()})`;
      }

      // If photo exists and Web App is connected, upload photo first
      let uploadedPhotoUrl = photoData;
      if (photoData.startsWith('data:image')) {
        const uploadRes = await ApiService.uploadPhoto(photoData);
        if (uploadRes.ok && uploadRes.photoUrl) {
          uploadedPhotoUrl = uploadRes.photoUrl;
        }
      }

      const res = await ApiService.addIssue({
        area: finalArea,
        type: fullType,
        sev,
        spot: spot.trim(),
        detail: detail.trim(),
        who: who.trim(),
        owner: owner.trim(),
        due,
        photo: uploadedPhotoUrl,
      });

      if (res.ok) {
        setCreatedId(res.id);
        onSuccess(res.id);
      } else {
        setErrorMessage(res.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCreatedId(null);
    setSpot('');
    setDetail('');
    setPhotoData('');
    setErrorMessage(null);
  };

  if (createdId) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">บันทึกข้อมูลปัญหาเรียบร้อยแล้ว</h2>
          <p className="text-sm text-slate-600 mb-2">
            รหัสปัญหา: <span className="font-mono font-bold text-slate-900 text-base">{createdId}</span>
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            ข้อมูลถูกบันทึกลงในระบบและส่งต่อเพื่อเข้าสู่คิวแก้ไขของฝ่ายที่เกี่ยวข้องแล้ว
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleResetForm}
              className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
            >
              + แจ้งปัญหาใหม่อีกรายการ
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
            >
              ดูรายการปัญหาทั้งหมด
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">แจ้งปัญหาหน้างาน / บันทึกความผิดปกติ</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              บันทึกปัญหาที่พบในไลน์การผลิต เครื่องจักร สโตร์ หรือความปลอดภัย
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
            Factory Floor
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Who & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Who */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ผู้แจ้งปัญหา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={who}
                onChange={e => setWho(e.target.value)}
                placeholder="เช่น สมชาย ประจำไลน์ 1, อารีย์ QC"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">ระบุชื่อหรือตำแหน่งของผู้พบปัญหา</span>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                ระดับความเร่งด่วน <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSev('ปกติ')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    sev === 'ปกติ'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟢 ปกติ
                </button>
                <button
                  type="button"
                  onClick={() => setSev('ด่วน')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    sev === 'ด่วน'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟡 ด่วน
                </button>
                <button
                  type="button"
                  onClick={() => setSev('อันตราย')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    sev === 'อันตราย'
                      ? 'bg-red-600 text-white border-red-700 shadow-xs ring-2 ring-red-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔴 อันตราย
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {sev === 'อันตราย' ? 'ส่งผลต่อความปลอดภัยหรือหยุดไลน์ผลิตทันที' : sev === 'ด่วน' ? 'ต้องแก้ไขภายในวัน' : 'แก้ไขตามรอบปกติ'}
              </span>
              {sev === 'อันตราย' && (
                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span>ระบบจะส่งข้อความแจ้งเตือนไปยัง LINE Notify กลุ่มฉุกเฉินอัตโนมัติทันที</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Area & Spot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                พื้นที่ / แผนก <span className="text-red-500">*</span>
              </label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 bg-white"
              >
                {DEFAULT_AREAS.map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value="OTHER">+ ระบุพื้นที่อื่น ๆ</option>
              </select>

              {area === 'OTHER' && (
                <input
                  type="text"
                  required
                  placeholder="พิมพ์ระบุชื่อพื้นที่หรืออาคาร..."
                  value={customArea}
                  onChange={e => setCustomArea(e.target.value)}
                  className="mt-2 w-full text-sm py-1.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              )}
            </div>

            {/* Spot / Machine */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                จุดที่พบ / หมายเลขเครื่องจักร
              </label>
              <input
                type="text"
                value={spot}
                onChange={e => setSpot(e.target.value)}
                placeholder="เช่น หุ่นยนต์ Robot-02, ประตู Dock 3, สายพาน A"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">ระบุตำแหน่งที่เจาะจงเพื่อให้ช่างไปถูกจุด</span>
            </div>
          </div>

          {/* Row 3: Category & Subtype */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              ประเภทปัญหา (จาก Config โรงงาน) <span className="text-red-500">*</span>
            </label>

            {/* Main Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {parsedGroups.map(grp => (
                <button
                  key={grp.groupName}
                  type="button"
                  onClick={() => handleGroupChange(grp.groupName)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedGroup === grp.groupName
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {grp.groupName}
                </button>
              ))}
            </div>

            {/* Sub-types selection */}
            {activeGroup && activeGroup.subTypes.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 block mb-1.5">อาการหรือลักษณะความผิดปกติ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeGroup.subTypes.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubtype(sub)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        selectedSubtype === sub
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-medium'
                          : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                value={customTypeDetail}
                onChange={e => setCustomTypeDetail(e.target.value)}
                placeholder="ระบุอาการย่อยเพิ่มเติม (ถ้ามี)"
                className="w-full text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Detail Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รายละเอียดปัญหา / อาการที่เกิดขึ้น <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="อธิบายอาการอย่างละเอียด เช่น พบคราบน้ำมันหยดใต้แท่นเครื่องจักร ชิ้นงานมีรอยขีดข่วนยาว 3 ซม. ฯลฯ"
              className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900"
            />
          </div>

          {/* Row 5: Owner & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ผู้รับผิดชอบ / ช่างที่มอบหมาย (ถ้ามี)
              </label>
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="เช่น ช่างวิรัช, หัวหน้ากะ A"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                วันที่แจ้ง
              </label>
              <input
                type="date"
                value={due}
                onChange={e => setDue(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Row 6: Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              แนบภาพถ่ายหน้างาน (บันทึกลง Google Drive อัตโนมัติ)
            </label>

            {photoData ? (
              <div className="relative inline-block border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-black">
                <img
                  src={photoData}
                  alt="รูปถ่ายปัญหา"
                  className="max-h-56 max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setPhotoData('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md"
                  title="ลบรูปภาพนี้"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  เปิดกล้องถ่ายภาพ
                </button>

                <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors border border-slate-200">
                  <Upload className="w-4 h-4 text-slate-500" />
                  เลือกรูปภาพจากเครื่อง
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                <span className="text-xs text-slate-400">รองรับภาพถ่าย JPG/PNG สูงสุด 3MB</span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึกข้อมูล...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  บันทึกแจ้งปัญหา
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCapture}
      />
    </div>
  );
};
