import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Wrench, 
  User, 
  Calendar, 
  Printer, 
  Trash2, 
  Edit3, 
  RotateCcw,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Issue, FREE_FIELDS } from '../types.ts';
import { ApiService } from '../services/api.ts';
import { PinModal } from './PinModal.tsx';

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onUpdated,
}) => {
  if (!issue) return null;

  // Local state for Quick Close form
  const [fixMethod, setFixMethod] = useState(issue.fixMethod || '');
  const [fixBy, setFixBy] = useState(issue.fixBy || '');
  const [isClosingWork, setIsClosingWork] = useState(false);
  const [statusDraft, setStatusDraft] = useState(issue.status);

  // Admin PIN modal state
  const [pinAction, setPinAction] = useState<'edit' | 'delete' | null>(null);
  const [isEditingFull, setIsEditingFull] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  // Editable fields during full edit
  const [editArea, setEditArea] = useState(issue.area);
  const [editSpot, setEditSpot] = useState(issue.spot);
  const [editSev, setEditSev] = useState(issue.sev);
  const [editDetail, setEditDetail] = useState(issue.detail);
  const [editOwner, setEditOwner] = useState(issue.owner);
  const [editDue, setEditDue] = useState(issue.due);
  const [editWho, setEditWho] = useState(issue.who);

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const isClosed = issue.status === 'Closed';

  const formatTimestamp = (ts: number) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return `${date.toLocaleDateString('th-TH')} ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Quick close action (FREE field, no PIN needed)
  const handleQuickClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixMethod.trim()) {
      setErrorText('กรุณาระบุวิธีแก้ไข / มาตรการจัดการปัญหา');
      return;
    }
    if (!fixBy.trim()) {
      setErrorText('กรุณาระบุชื่อผู้แก้ไข / ผู้ปิดงาน');
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      const res = await ApiService.updateIssue(issue.id, {
        status: 'Closed',
        closedAt: Date.now(),
        fixMethod: fixMethod.trim(),
        fixBy: fixBy.trim(),
      });

      if (res.ok) {
        setIsClosingWork(false);
        onUpdated();
      } else {
        setErrorText(res.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch {
      setErrorText('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick status change (FREE field, no PIN needed)
  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const payload: Partial<Issue> = { status: newStatus };
      if (newStatus === 'Open' || newStatus === 'Progress') {
        payload.closedAt = 0;
      }
      const res = await ApiService.updateIssue(issue.id, payload);
      if (res.ok) {
        onUpdated();
      } else {
        setErrorText(res.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setErrorText('ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Full Edit Save (Requires Admin PIN)
  const handleFullEditSave = async () => {
    setIsLoading(true);
    setErrorText(null);

    try {
      const res = await ApiService.updateIssue(
        issue.id,
        {
          area: editArea,
          spot: editSpot,
          sev: editSev,
          detail: editDetail,
          owner: editOwner,
          due: editDue,
          who: editWho,
          fixMethod,
          fixBy,
        },
        adminPin
      );

      if (res.ok) {
        setIsEditingFull(false);
        onUpdated();
      } else {
        setErrorText(res.error === 'pin' ? 'รหัส PIN ไม่ถูกต้อง' : 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } catch {
      setErrorText('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete (Requires Admin PIN)
  const handleDeleteConfirm = async (pin: string) => {
    setIsLoading(true);
    try {
      const res = await ApiService.deleteIssues([issue.id], pin);
      if (res.ok) {
        onClose();
        onUpdated();
      } else {
        setErrorText(res.error === 'pin' ? 'รหัส PIN ไม่ถูกต้อง' : 'ลบรายการไม่สำเร็จ');
      }
    } catch {
      setErrorText('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                #{issue.id}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span>{issue.type.split(':')[0] || 'ปัญหาทั่วไป'}</span>
                <span>·</span>
                <span>{formatTimestamp(issue.created)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="พิมพ์ใบแจ้งซ่อม / ใบปะหน้า"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {errorText && (
            <div className="p-3 bg-red-50 text-red-700 text-xs flex items-center gap-2 border-b border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Printable Ticket Area */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status & Severity Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">สถานะ:</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    issue.status === 'Closed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : issue.status === 'Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {issue.status === 'Closed' ? 'Closed (ปิดงานแล้ว)' : issue.status === 'Progress' ? 'Progress (กำลังแก้ไข)' : 'Open (รอรับงาน)'}
                </span>

                {/* Quick Status Dropdown (FREE permission) */}
                <select
                  value={issue.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={isLoading}
                  className="text-xs py-1 px-2 border border-slate-300 rounded-md bg-white text-slate-700 outline-none"
                >
                  <option value="Open">เปลี่ยนเป็น Open</option>
                  <option value="Progress">เปลี่ยนเป็น Progress</option>
                  <option value="Closed">เปลี่ยนเป็น Closed</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">ความเร่งด่วน:</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    issue.sev === 'อันตราย'
                      ? 'bg-red-100 text-red-800'
                      : issue.sev === 'ด่วน'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {issue.sev === 'อันตราย' ? '🔴 อันตราย' : issue.sev === 'ด่วน' ? '🟡 ด่วน' : '🟢 ปกติ'}
                </span>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> พื้นที่ / แผนก
                </span>
                {isEditingFull ? (
                  <input
                    type="text"
                    value={editArea}
                    onChange={e => setEditArea(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 text-sm">{issue.area || '-'}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> จุดที่พบ / เครื่องจักร
                </span>
                {isEditingFull ? (
                  <input
                    type="text"
                    value={editSpot}
                    onChange={e => setEditSpot(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 text-sm">{issue.spot || '-'}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> ผู้แจ้งปัญหา
                </span>
                {isEditingFull ? (
                  <input
                    type="text"
                    value={editWho}
                    onChange={e => setEditWho(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                ) : (
                  <p className="font-semibold text-slate-900">{issue.who || '-'}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> วันที่แจ้ง
                </span>
                {isEditingFull ? (
                  <input
                    type="date"
                    value={editDue}
                    onChange={e => setEditDue(e.target.value)}
                    className="w-full p-1.5 border rounded text-xs"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 font-mono">{issue.due || '-'}</p>
                )}
              </div>
            </div>

            {/* Category / Type info */}
            <div>
              <span className="text-slate-500 text-xs block mb-1">ประเภทความผิดปกติ:</span>
              <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                {issue.type}
              </p>
            </div>

            {/* Problem Detail */}
            <div>
              <span className="text-slate-500 text-xs block mb-1 font-medium">รายละเอียดปัญหา:</span>
              {isEditingFull ? (
                <textarea
                  rows={3}
                  value={editDetail}
                  onChange={e => setEditDetail(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {issue.detail}
                </div>
              )}
            </div>

            {/* Photo Section */}
            {issue.photo && (
              <div>
                <span className="text-slate-500 text-xs block mb-1.5 font-medium">รูปภาพหน้างาน:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center max-h-72">
                  <img
                    src={issue.photo}
                    alt="รูปภาพปัญหา"
                    className="w-full h-full max-h-72 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Resolution Information / Fix Method */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  การแก้ไขปัญหา & การปิดงาน
                </h3>
                {isClosed && (
                  <span className="text-[11px] text-slate-500">
                    ปิดงานเมื่อ: {formatTimestamp(issue.closedAt)}
                  </span>
                )}
              </div>

              {isClosed ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 space-y-2 text-xs">
                  <div>
                    <span className="text-emerald-800 font-semibold block">วิธีแก้ไขปัญหา:</span>
                    <p className="text-emerald-950 mt-0.5 whitespace-pre-wrap">
                      {issue.fixMethod || 'ไม่ระบุรายละเอียด'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-100 text-emerald-700">
                    <span>ผู้ปิดงาน: <strong className="text-emerald-900">{issue.fixBy || '-'}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('Open')}
                      className="text-xs text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      เปิดงานใหม่ (Reopen)
                    </button>
                  </div>
                </div>
              ) : isClosingWork ? (
                <form onSubmit={handleQuickClose} className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-800">บันทึกวิธีการแก้ไขเพื่อปิดงาน:</h4>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      วิธีการแก้ไข / มาตรการจัดการ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={fixMethod}
                      onChange={e => setFixMethod(e.target.value)}
                      placeholder="เช่น เปลี่ยนอะไหล่ซีลยาง, ตรวจเช็คค่าแรงดันเรียบร้อย..."
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      ผู้ปิดงาน / ช่างผู้ดำเนินการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fixBy}
                      onChange={e => setFixBy(e.target.value)}
                      placeholder="ชื่อช่างหรือผู้ตรวจสอบ"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsClosingWork(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      ยืนยันและปิดงาน
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-600">
                    งานนี้ยังไม่ได้รับการปิด สามารถบันทึกวิธีแก้ไขเพื่อเปลี่ยนสถานะเป็น Closed ได้ทันที
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsClosingWork(true)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ปิดงานรายการนี้
                  </button>
                </div>
              )}
            </div>

            {/* Print Slip Layout (only visible during print) */}
            <div className="hidden print-only mt-8 border-t-2 border-dashed border-slate-400 pt-6">
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div className="border border-slate-300 p-4 rounded text-center">
                  <p className="text-slate-500 mb-6">ลงชื่อ ผู้รายงานปัญหา</p>
                  <p className="border-b border-slate-400 pb-1 font-semibold">{issue.who}</p>
                  <p className="text-slate-400 text-[10px] mt-1">วันที่ ......./......./...........</p>
                </div>
                <div className="border border-slate-300 p-4 rounded text-center">
                  <p className="text-slate-500 mb-6">ลงชื่อ ช่างซ่อมบำรุง / ผู้ตรวจรับ</p>
                  <p className="border-b border-slate-400 pb-1 font-semibold">{issue.fixBy || '...........................................'}</p>
                  <p className="text-slate-400 text-[10px] mt-1">วันที่ ......./......./...........</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPinAction('delete')}
                className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 inline-flex items-center gap-1"
                title="ลบรายการปัญหานี้ (ต้องใช้ Admin PIN)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายการ</span>
              </button>

              {!isEditingFull ? (
                <button
                  type="button"
                  onClick={() => setPinAction('edit')}
                  className="text-slate-600 hover:text-slate-800 p-1.5 rounded hover:bg-slate-200/60 inline-flex items-center gap-1"
                  title="แก้ไขข้อมูลหลัก (ต้องใช้ Admin PIN)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลหลัก</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFullEditSave}
                  disabled={isLoading}
                  className="bg-amber-500 text-slate-950 font-semibold px-3 py-1 rounded hover:bg-amber-600"
                >
                  บันทึกการแก้ไข
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* Pin verification modal */}
      <PinModal
        isOpen={Boolean(pinAction)}
        title={pinAction === 'delete' ? 'ยืนยันรหัส PIN เพื่อลบรายการ' : 'ยืนยันรหัส PIN เพื่อแก้ไขข้อมูลหลัก'}
        description={pinAction === 'delete' ? 'การลบรายการปัญหาออกจากระบบต้องได้รับสิทธิ์จากผู้ดูแลระบบ' : 'การแก้ไขพื้นที่ ผู้แจ้ง หรือความเร่งด่วนต้องใช้รหัส PIN'}
        onClose={() => setPinAction(null)}
        onSuccess={pin => {
          if (pinAction === 'delete') {
            handleDeleteConfirm(pin);
          } else if (pinAction === 'edit') {
            setAdminPin(pin);
            setIsEditingFull(true);
          }
          setPinAction(null);
        }}
      />
    </>
  );
};
