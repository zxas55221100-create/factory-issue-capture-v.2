import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api.ts';

interface PinModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  title = 'ยืนยันรหัสผ่าน Admin PIN',
  description = 'การแก้ไขข้อมูลหลักหรือลบข้อมูลจำเป็นต้องระบุรหัส PIN ของผู้ดูแลระบบ',
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('กรุณากรอกรหัส PIN');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await ApiService.verifyPin(pin);
      if (isValid) {
        onSuccess(pin);
        onClose();
      } else {
        setError('รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้นในระบบคือ 721909)');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบรหัส PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyClick = (val: string) => {
    if (pin.length < 10) {
      setPin(prev => prev + val);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <Lock className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5">
          <p className="text-xs text-slate-500 mb-4">{description}</p>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              รหัส Admin PIN (6 หลัก)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center text-2xl tracking-widest font-mono py-2.5 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 bg-slate-50"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  if (btn === 'C') setPin('');
                  else if (btn === '⌫') handleBackspace();
                  else handleKeyClick(btn);
                }}
                className="py-2.5 text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors font-mono"
              >
                {btn}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isVerifying || pin.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg shadow-xs transition-colors"
            >
              {isVerifying ? 'กำลังตรวจสอบ...' : 'ยืนยัน PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
