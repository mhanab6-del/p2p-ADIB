import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ExternalLink, Copy, Check, Settings2, Smartphone, ShieldCheck, Move } from 'lucide-react';
import { DocumentQrConfig, Language } from '../types';

interface DocumentQrOverlayProps {
  config: DocumentQrConfig;
  lang: Language;
  onOpenSettings: () => void;
  onUpdatePosition?: (x: number, y: number) => void;
  isReadOnly?: boolean;
}

export const DocumentQrOverlay: React.FC<DocumentQrOverlayProps> = ({
  config,
  lang,
  onOpenSettings,
  onUpdatePosition,
  isReadOnly = false,
}) => {
  const isAr = lang === 'ar';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // Determine dark color by theme
  const colorMap = {
    adib: '#002b49', // ADIB Deep Navy
    classic: '#000000',
    emerald: '#064e3b',
  };

  const darkColor = colorMap[config.theme] || '#002b49';

  // Generate the actual working QR code data URL
  useEffect(() => {
    let isMounted = true;
    if (!config.enabled || !config.url) return;

    QRCode.toDataURL(config.url, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating in-document QR:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [config.enabled, config.url, darkColor]);

  if (!config.enabled) return null;

  // Calculate coordinates based on preset
  let leftPercent = 43.39;
  let topPercent = 54.22;
  let widthPercent = config.sizePercent || 9.11;
  // In A4 standard ratio (1:1.4142), a square width of W% has height of W * (1240/1754) = W * 0.7069
  let heightPercent = widthPercent * (1240 / 1754);

  if (config.position === 'cert-default') {
    leftPercent = 43.39;
    topPercent = 54.22;
    widthPercent = config.sizePercent || 9.11;
    heightPercent = widthPercent * (1240 / 1754);
  } else if (config.position === 'bottom-right') {
    leftPercent = 84;
    topPercent = 87;
    widthPercent = 10;
    heightPercent = 10 * (1240 / 1754);
  } else if (config.position === 'bottom-left') {
    leftPercent = 6;
    topPercent = 87;
    widthPercent = 10;
    heightPercent = 10 * (1240 / 1754);
  } else if (config.position === 'top-right') {
    leftPercent = 84;
    topPercent = 5;
    widthPercent = 10;
    heightPercent = 10 * (1240 / 1754);
  } else if (config.position === 'top-left') {
    leftPercent = 6;
    topPercent = 5;
    widthPercent = 10;
    heightPercent = 10 * (1240 / 1754);
  } else if (config.position === 'custom') {
    leftPercent = config.customX;
    topPercent = config.customY;
    widthPercent = config.sizePercent;
    heightPercent = config.sizePercent * (1240 / 1754);
  }

  // Handle Dragging in custom mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (config.position !== 'custom' || !onUpdatePosition || isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: leftPercent,
      startY: topPercent,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current) return;
      const sheet = document.getElementById('pdf-page-sheet');
      if (!sheet) return;
      const rect = sheet.getBoundingClientRect();

      const deltaXPercent = ((moveEvent.clientX - dragStartPos.current.mouseX) / rect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - dragStartPos.current.mouseY) / rect.height) * 100;

      const newX = Math.max(0, Math.min(95 - widthPercent, dragStartPos.current.startX + deltaXPercent));
      const newY = Math.max(0, Math.min(95 - heightPercent, dragStartPos.current.startY + deltaYPercent));

      onUpdatePosition(Number(newX.toFixed(2)), Number(newY.toFixed(2)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartPos.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(config.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // If not dragging in custom mode, clicking directly navigates to the QR target URL
    if (isDragging) return;
    // Don't open if target was one of the toolbar action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    if (config.url) {
      window.open(config.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id="in-document-qr-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onClick={handleContainerClick}
      className={`absolute z-20 select-none group transition-all duration-100 ${
        config.position === 'custom' && !isReadOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      }`}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
      }}
      title={isAr ? 'انقر لفتح رابط التحقق الرسمي من الوثيقة مباشرة' : 'Click to open document verification link'}
    >
      {/* Real scannable QR Image embedded inside the document */}
      <div
        className={`relative w-full h-full bg-white rounded-[2px] p-[1.5%] shadow-sm border border-slate-300/80 transition-all ${
          isHovered ? 'ring-2 ring-[#0090df] shadow-lg scale-105 z-30' : ''
        }`}
      >
        {qrDataUrl ? (
          <img
            id="in-doc-qr-image"
            src={qrDataUrl}
            alt="Working Document QR Code"
            className="w-full h-full object-contain block select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] text-slate-400">
            QR
          </div>
        )}

        {/* Small center emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[18%] h-[18%] min-w-[10px] min-h-[10px] bg-white rounded-full border border-slate-200/90 shadow-2xs flex items-center justify-center">
            <span className="text-[6px] font-black text-[#002b49] leading-none">✓</span>
          </div>
        </div>
      </div>

      {/* Floating Interactive Badge / Action Bar on Hover */}
      {isHovered && !isDragging && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-2xl border border-emerald-500/80 whitespace-nowrap z-40 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-[10px]">{isAr ? 'رمز QR فعّال' : 'Active QR'}</span>
          </div>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Test Link Button (Opens in new tab) */}
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[#c5a059] px-1 py-0.5 rounded hover:bg-white/10 transition text-[10px]"
            title={isAr ? 'اختبار فتح الرابط المشفر بالرمز في نافذة جديدة' : 'Test QR encoded link in new tab'}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-2.5 h-2.5" />
            <span>{isAr ? 'فتح' : 'Open'}</span>
          </a>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 hover:text-[#c5a059] px-1 py-0.5 rounded hover:bg-white/10 transition text-[10px] cursor-pointer"
            title={isAr ? 'نسخ الرابط المشفر' : 'Copy link'}
          >
            {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{isCopied ? (isAr ? 'تم!' : 'Copied!') : isAr ? 'نسخ' : 'Copy'}</span>
          </button>

          {/* Settings Button */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSettings();
              }}
              className="flex items-center gap-1 hover:text-[#c5a059] px-1 py-0.5 rounded hover:bg-white/10 transition text-[10px] cursor-pointer"
              title={isAr ? 'تعديل موضع وحجم ورابط الرمز داخل الوثيقة' : 'Customize document QR position & settings'}
            >
              <Settings2 className="w-2.5 h-2.5" />
              <span>{isAr ? 'تعديل' : 'Settings'}</span>
            </button>
          )}

          {config.position === 'custom' && (
            <div
              className="flex items-center text-slate-400 text-[9px] gap-0.5 ps-0.5"
              title={isAr ? 'يمكنك سحبه بالماوس لتغيير مكانه' : 'Draggable with mouse'}
            >
              <Move className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
