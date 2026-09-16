import React from 'react';
import { Info, Globe, CheckCircle2, Lock, FileCheck, Search, MapPin, QrCode, Link2, EyeOff, SlidersHorizontal, FolderGit2 } from 'lucide-react';
import { VerificationDetails, Language } from '../types';

interface AdibHeaderProps {
  lang: Language;
  onLanguageToggle: () => void;
  verification: VerificationDetails;
  onOpenDetailsModal: () => void;
  onOpenQrModal: () => void;
  onOpenDocumentQrModal?: () => void;
  onOpenGitHubModal?: () => void;
  onOpenDriveModal?: () => void;
  isToolbarVisible?: boolean;
  onToggleToolbar?: () => void;
}

export const AdibHeader: React.FC<AdibHeaderProps> = ({
  lang,
  onLanguageToggle,
  verification,
  onOpenDetailsModal,
  onOpenQrModal,
  onOpenDocumentQrModal,
  onOpenGitHubModal,
  onOpenDriveModal,
  isToolbarVisible = true,
  onToggleToolbar,
}) => {
  const isAr = lang === 'ar';

  return (
    <header
      id="adib-official-header"
      className="no-print bg-[#003865] text-white border-b border-[#002b49] shadow-md z-30 transition-all select-none"
    >
      {/* Top micro-bar for bank authority */}
      <div className="bg-[#00223d] text-slate-300 text-[11px] py-1 pt-safe px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-[#c5a059]" />
            <span className="font-medium tracking-wide">
              {isAr
                ? 'البوابة الإلكترونية الرسمية للتحقق من صحة الوثائق والمستندات - مصرف أبوظبي الإسلامي'
                : 'Official Document Verification Portal - Abu Dhabi Islamic Bank (ADIB)'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 hidden md:inline">
              {isAr ? 'مرخص من قبل مصرف الإمارات المركزي' : 'Licensed by Central Bank of the UAE'}
            </span>
            <button
              onClick={onLanguageToggle}
              className="flex items-center gap-1.5 hover:text-[#c5a059] font-medium transition cursor-pointer text-slate-200"
              title="تغيير اللغة / Change Language"
            >
              <Globe className="w-3 h-3 text-[#c5a059]" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bank Navigation bar matching official ADIB branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Logo & Portal title (Top right in Arabic RTL) */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          {/* Official ADIB Logo Image */}
          <div className="flex items-center shrink-0">
            <img
              id="adib-official-logo"
              src="/adib_logo_white.png"
              alt="ADIB - مصرف أبوظبي الإسلامي"
              className="h-8 sm:h-9.5 md:h-10 w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
            />
          </div>

          <div className="h-7 w-px bg-white/20 hidden sm:block shrink-0" />

          {/* Portal Verification title */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#c5a059] shrink-0 hidden xs:block" />
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                {isAr ? 'التحقق من صحة المستندات' : 'Document Verification'}
              </h1>
            </div>
            <span className="text-[10px] text-blue-200/90 font-mono hidden md:block">
              {verification.refNumber}
            </span>
          </div>
        </div>

        {/* Action Controls & Official ADIB Navigation items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Verified status badge */}
          <div
            id="adib-verification-badge"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold shadow-xs"
            title={isAr ? 'تم التحقق من الوثيقة وهي مطابقة لسجلات البنك' : 'Document verified authentic with ADIB records'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden xs:inline">
              {isAr ? 'مستند موثّق وصالح' : 'Authentic & Verified'}
            </span>
            <span className="xs:hidden">
              {isAr ? 'موثّق' : 'Verified'}
            </span>
          </div>

          {/* Details modal trigger */}
          <button
            id="btn-adib-doc-details"
            onClick={onOpenDetailsModal}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition cursor-pointer"
            title={isAr ? 'عرض بيانات شهادة التوثيق' : 'View certificate security details'}
          >
            <Info className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">
              {isAr ? 'تفاصيل الوثيقة' : 'Certificate Details'}
            </span>
          </button>

          {/* Toggle Toolbar Button (Hide/Show) */}
          {onToggleToolbar && (
            <button
              id="btn-adib-toggle-toolbar"
              onClick={onToggleToolbar}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isToolbarVisible
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  : 'bg-gradient-to-r from-amber-400 to-[#c5a059] text-slate-950 border-[#c5a059] shadow-md ring-2 ring-amber-300/40'
              }`}
              title={
                isToolbarVisible
                  ? isAr ? 'إخفاء شريط أدوات المستند (لتكبير مساحة القراءة)' : 'Hide document toolbar'
                  : isAr ? 'إظهار شريط أدوات المستند' : 'Show document toolbar'
              }
            >
              {isToolbarVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="hidden sm:inline">{isAr ? 'إخفاء الأدوات' : 'Hide Tools'}</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  <span className="font-bold">{isAr ? 'إظهار الأدوات' : 'Show Tools'}</span>
                </>
              )}
            </button>
          )}

          {/* In-Document QR Settings Trigger */}
          {onOpenDocumentQrModal && (
            <button
              id="btn-adib-in-doc-qr"
              onClick={onOpenDocumentQrModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-semibold shadow-xs transition cursor-pointer"
              title={isAr ? 'رمز QR الفعّال داخل صفحة الوثيقة والـ PDF' : 'In-Document Live QR Code'}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">
                {isAr ? 'رمز QR بالوثيقة' : 'In-Doc QR'}
              </span>
            </button>
          )}

          {/* GitHub Integration Trigger */}
          {onOpenGitHubModal && (
            <button
              id="btn-adib-github-export"
              onClick={onOpenGitHubModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 shadow-xs transition cursor-pointer"
              title={isAr ? 'رفع التغييرات إلى مستودع GitHub' : 'Export & Push to GitHub'}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="hidden md:inline">GitHub</span>
            </button>
          )}

          {/* Page Link & QR Code Modal Trigger */}
          <button
            id="btn-adib-page-qr-link"
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#c5a059] to-amber-500 hover:from-amber-500 hover:to-[#c5a059] text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
            title={isAr ? 'الحصول على رابط الصفحة وتحويله إلى رمز QR' : 'Get page link and convert to QR code'}
          >
            <QrCode className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span className="hidden xs:inline">
              {isAr ? 'رابط الصفحة ورمز QR' : 'Link & QR Code'}
            </span>
            <span className="xs:hidden">
              {isAr ? 'رمز QR' : 'QR'}
            </span>
          </button>

          {/* Google Drive Integration Trigger */}
          {onOpenDriveModal && (
            <button
              id="btn-adib-google-drive"
              onClick={onOpenDriveModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 shadow-xs transition cursor-pointer"
              title={isAr ? 'حفظ أو استيراد الشهادات من Google Drive' : 'Save or import certificates with Google Drive'}
            >
              <svg viewBox="0 0 87.3 78" className="w-3.5 h-3.5 shrink-0">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.1 10.55z" fill="#ea4335"/>
                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
                <path d="M59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z" fill="#ffba00"/>
                <path d="M73.55 76.8H27.5L13.75 53h59.8c0 1.55-.4 3.1-1.2 4.5z" fill="#2684fc"/>
              </svg>
              <span className="hidden sm:inline">Google Drive</span>
            </button>
          )}

          {/* Official Bank Quick Actions from screenshot (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 border-s border-white/20 ps-3">
            {/* Search icon */}
            <button
              className="p-1.5 text-white/80 hover:text-white transition cursor-pointer"
              title={isAr ? 'البحث في خدمات المصرف' : 'Search ADIB services'}
            >
              <Search className="w-4 h-4" />
            </button>
            {/* Branches / Location icon */}
            <button
              className="p-1.5 text-white/80 hover:text-white transition cursor-pointer"
              title={isAr ? 'الفروع وأجهزة الصراف الآلي' : 'Branches & ATMs'}
            >
              <MapPin className="w-4 h-4" />
            </button>
            {/* Country flag indicator */}
            <div className="flex items-center gap-1 text-xs text-white/90 font-medium px-1">
              <span className="text-sm">🇦🇪</span>
              <span className="text-[11px] font-semibold">{isAr ? '-EN' : '-AR'}</span>
            </div>
            {/* Official Cyan Log In Button */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0090df] hover:bg-[#0080c7] text-white text-xs font-bold shadow-xs cursor-pointer transition select-none"
              title={isAr ? 'تسجيل الدخول إلى الخدمات المصرفية' : 'ADIB Online Banking Login'}
            >
              <span>LOG IN</span>
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
