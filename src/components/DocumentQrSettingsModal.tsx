import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Check,
  CheckCircle2,
  ExternalLink,
  Copy,
  Smartphone,
  Sparkles,
  Sliders,
  Move,
  Printer,
  Download,
  RotateCcw,
  Palette,
  FileCheck2,
} from 'lucide-react';
import { DocumentQrConfig, Language, QrPositionPreset } from '../types';

interface DocumentQrSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DocumentQrConfig;
  onSaveConfig: (newConfig: DocumentQrConfig) => void;
  lang: Language;
}

export const DocumentQrSettingsModal: React.FC<DocumentQrSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [localConfig, setLocalConfig] = useState<DocumentQrConfig>(config);
  const [previewQr, setPreviewQr] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  // Generate preview
  useEffect(() => {
    if (!isOpen || !localConfig.url) return;

    const darkColor =
      localConfig.theme === 'adib'
        ? '#002b49'
        : localConfig.theme === 'emerald'
        ? '#064e3b'
        : '#000000';

    QRCode.toDataURL(localConfig.url, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
    })
      .then((url) => setPreviewQr(url))
      .catch((err) => console.warn('Preview QR error:', err));
  }, [isOpen, localConfig.url, localConfig.theme]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(localConfig.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const getLiveDefaultUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin.replace('ais-dev-', 'ais-pre-');
    return `${origin}/?REF=26/472376/70672211/HFO&VERIFIED=1`;
  };

  const positionPresets: { id: QrPositionPreset; labelAr: string; labelEn: string; descAr: string }[] = [
    {
      id: 'cert-default',
      labelAr: 'مركز الشهادة (الموضع المعتمد)',
      labelEn: 'Certificate Center (Official)',
      descAr: 'الموضع المخصص تماماً لباركود الشهادة الأصلية (بدقة 100%)',
    },
    {
      id: 'bottom-right',
      labelAr: 'أسفل اليمين',
      labelEn: 'Bottom Right',
      descAr: 'بجوار الختم والتوقيع الرسمي للمصرف',
    },
    {
      id: 'bottom-left',
      labelAr: 'أسفل اليسار',
      labelEn: 'Bottom Left',
      descAr: 'أسفل الصفحة في الركن الأيسر',
    },
    {
      id: 'top-right',
      labelAr: 'أعلى اليمين',
      labelEn: 'Top Right',
      descAr: 'أسفل ترويسة وشعار المصرف مباشرة',
    },
    {
      id: 'custom',
      labelAr: 'موضع حر وقابل للسحب',
      labelEn: 'Custom Draggable',
      descAr: 'يمكنك سحب الرمز بالماوس وإفلاته في أي مكان بالوثيقة',
    },
  ];

  return (
    <div
      id="document-qr-settings-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#002b49] to-[#001f35]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'إعدادات رمز الـ QR داخل الوثيقة' : 'In-Document QR Code Settings'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAr ? 'يعمل بالمسح الفوري' : 'Live Scannable'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'توليد باركود QR ذكي وحقيقي ومطابق للمواصفات وموضوع مباشرة داخل الشهادة والـ PDF'
                  : 'Configure working scannable QR code embedded directly inside document and PDF'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-doc-qr-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4.5 custom-scrollbar text-slate-200 text-xs sm:text-sm">
          {/* Main Enable/Disable Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  {isAr ? 'إظهار رمز QR الفعّال داخل الوثيقة' : 'Display Scannable QR Code Inside Document'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isAr
                    ? 'يتم عرض الرمز بجودة فائقة داخل صفحة المستند مع إمكانية مسحه بكاميرا الهاتف وتنزيله مع الـ PDF'
                    : 'Renders crisp QR on the document canvas, scannable by camera and exported in PDF'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="toggle-doc-qr-enabled"
                type="checkbox"
                checked={localConfig.enabled}
                onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Dual Column: Settings & Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column: Config Options (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Position Preset selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>{isAr ? 'موضع الرمز على الوثيقة:' : 'QR Position on Document:'}</span>
                </label>
                <div className="space-y-1.5">
                  {positionPresets.map((preset) => {
                    const isSelected = localConfig.position === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setLocalConfig({ ...localConfig, position: preset.id })}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#003865]/70 border-[#c5a059] text-white shadow-sm ring-1 ring-[#c5a059]/40'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#c5a059] bg-[#c5a059]' : 'border-slate-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-white block">
                              {isAr ? preset.labelAr : preset.labelEn}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {preset.descAr}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QR Size Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>{isAr ? 'حجم الرمز:' : 'QR Code Size:'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { labelAr: 'مضغوط (7%)', labelEn: 'Compact', size: 7.2 },
                    { labelAr: 'مطابق للأصل (9.1%)', labelEn: 'Standard (9.1%)', size: 9.11 },
                    { labelAr: 'كبير وواضح (12%)', labelEn: 'Large (12%)', size: 12.0 },
                  ].map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, sizePercent: s.size })}
                      className={`py-2 px-2 rounded-lg font-medium transition cursor-pointer text-center text-xs ${
                        Math.abs(localConfig.sizePercent - s.size) < 0.1
                          ? 'bg-[#003865] text-white ring-1 ring-[#c5a059]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? s.labelAr : s.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme & Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>{isAr ? 'لون الرمز:' : 'QR Theme Color:'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'adib', nameAr: 'كحلي المصرف (ADIB)', nameEn: 'ADIB Navy', color: '#002b49' },
                    { id: 'classic', nameAr: 'أسود كلاسيكي', nameEn: 'Classic Black', color: '#000000' },
                    { id: 'emerald', nameAr: 'أخضر التوثيق', nameEn: 'Emerald Green', color: '#064e3b' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, theme: theme.id as any })}
                      className={`py-2 px-2 rounded-lg font-medium transition cursor-pointer text-center text-xs flex items-center justify-center gap-1.5 ${
                        localConfig.theme === theme.id
                          ? 'bg-slate-800 text-white ring-1 ring-[#c5a059]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span>{isAr ? theme.nameAr : theme.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Burn-in on PDF & Print checkbox */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      {isAr ? 'تضمين الرمز في ملف PDF المصدّر والطباعة' : 'Burn-in QR on Exported PDF & Print'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr
                        ? 'تثبيت الرمز في الملف الورقي ليظل قابلاً للمسح بعد الطباعة'
                        : 'Draws scannable QR on physical print & downloaded PDF'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.burnInPdf}
                  onChange={(e) => setLocalConfig({ ...localConfig, burnInPdf: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0090df] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Right Column: Live QR Preview & Phone Scan (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-between p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center">
              <div className="w-full">
                <span className="text-[11px] font-bold text-[#c5a059] uppercase block mb-1">
                  {isAr ? 'معاينة الرمز الفعّال' : 'Active Scannable Preview'}
                </span>
                <p className="text-[10px] text-slate-400 mb-3">
                  {isAr ? 'وجّه كاميرا هاتفك الآن للمسح والاختبار' : 'Point smartphone camera now to test'}
                </p>

                {/* The QR Box */}
                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#c5a059]/30 inline-block relative group">
                  {previewQr ? (
                    <div className="relative">
                      <img
                        src={previewQr}
                        alt="QR Preview"
                        className="w-36 h-36 sm:w-40 sm:h-40 block rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center">
                          <span className="text-[8px] font-black text-[#002b49]">ADIB</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                      QR Code
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? 'يعمل 100% مع كاميرا iOS و Android' : '100% Scannable with iOS & Android'}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="w-full space-y-1.5 mt-4">
                <a
                  href={localConfig.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-[#003865] hover:bg-[#002b49] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'اختبار فتح الرابط الآن' : 'Test Open Link Now'}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? (isAr ? 'تم نسخ الرابط!' : 'Link Copied!') : isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Encoded URL Box */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                {isAr ? 'الرابط المشفر داخل الرمز (Target URL):' : 'URL Encoded in QR Code:'}
              </span>
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, url: getLiveDefaultUrl() })}
                className="text-[11px] text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
                title={isAr ? 'استعادة رابط التحقق الرسمي الافتراضي' : 'Reset to default official verification link'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'استعادة الرابط الرسمي' : 'Reset to Official'}</span>
              </button>
            </div>
            <input
              type="text"
              dir="ltr"
              value={localConfig.url}
              onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono py-2 px-3 rounded-lg border border-slate-700 focus:outline-none focus:border-[#0090df]"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            id="btn-save-doc-qr-settings"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? 'حفظ وتطبيق على الوثيقة' : 'Save & Apply to Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
