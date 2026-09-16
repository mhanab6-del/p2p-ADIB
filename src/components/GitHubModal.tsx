import React, { useState } from 'react';
import {
  X,
  GitBranch,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  CheckCircle2,
  FolderGit2,
  Download,
  Share2,
  Lock,
} from 'lucide-react';
import { Language } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, lang }) => {
  const isAr = lang === 'ar';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [repoUrl, setRepoUrl] = useState('');

  if (!isOpen) return null;

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const defaultGitCommands = [
    {
      titleAr: 'ربط المستودع بعنوان GitHub الخاص بك:',
      titleEn: 'Link remote repository:',
      cmd: `git remote add origin ${repoUrl || 'https://github.com/USERNAME/REPOSITORY.git'}`,
    },
    {
      titleAr: 'تسمية الفرع الرئيسي main:',
      titleEn: 'Set main branch:',
      cmd: 'git branch -M main',
    },
    {
      titleAr: 'رفع جميع التغييرات والملفات إلى GitHub:',
      titleEn: 'Push changes to GitHub:',
      cmd: 'git push -u origin main',
    },
  ];

  const allInOneCommand = `git remote add origin ${
    repoUrl || 'https://github.com/USERNAME/REPOSITORY.git'
  } && git branch -M main && git push -u origin main`;

  return (
    <div
      id="github-export-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#181717] to-[#24292e]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20 shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{isAr ? 'رفع التغييرات إلى GitHub' : 'Push Changes to GitHub'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAr ? 'المستودع مهيّأ وجاهز' : 'Git Initialized'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'تم تجهيز وحفظ جميع التعديلات في Git محلياً وجاهزة للرفع إلى حسابك في GitHub'
                  : 'All changes are staged and committed in Git, ready to export or push to GitHub'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar text-slate-200 text-xs sm:text-sm">
          {/* Status Banner */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white text-xs block">
                {isAr ? 'تم عمل Commit لجميع التغييرات بنجاح!' : 'All changes committed successfully!'}
              </span>
              <p className="text-[11px] text-emerald-300/80">
                {isAr
                  ? 'فرع العمل الرئيسي: main • جاهز للمزامنة مع أي حساب أو مستودع على GitHub.'
                  : 'Active branch: main • Ready to push or export.'}
              </p>
            </div>
          </div>

          {/* Option 1: AI Studio Built-in 1-Click Export */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
              <span className="w-5 h-5 rounded-full bg-[#0090df] text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>{isAr ? 'الطريقة المباشرة عبر واجهة AI Studio:' : 'Direct via AI Studio Menu:'}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed ps-7">
              {isAr
                ? 'يمكنك الضغط مباشرة على قائمة الخيارات (الإعدادات / الثلاث نقاط أو زر Export) في الزاوية العلوية لنافذة AI Studio واختيار "Export to GitHub" أو "Download ZIP" لتحميل المشروع كاملاً ورفعه بنقرة واحدة بدون الحاجة لأوامر.'
                : 'Click the top-right Settings/Export menu in Google AI Studio and select "Export to GitHub" or "Download ZIP" to export with 1-click.'}
            </p>
          </div>

          {/* Option 2: Push via Terminal / Remote URL */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
              <span className="w-5 h-5 rounded-full bg-[#c5a059] text-slate-950 flex items-center justify-center text-xs">
                2
              </span>
              <span>{isAr ? 'الرفع المباشر إلى مستودعك الخاص (Git Push):' : 'Push to your GitHub Repository:'}</span>
            </div>

            {/* Custom Repo URL Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">
                {isAr ? 'رابط مستودعك على GitHub (اختياري لتوليد الأمر المخصص):' : 'Your GitHub Repository URL:'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/USERNAME/REPO_NAME.git"
                className="w-full bg-slate-950 text-slate-200 text-xs font-mono py-2 px-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Commands */}
            <div className="space-y-2">
              {defaultGitCommands.map((item, idx) => (
                <div key={idx} className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCommand(item.cmd, idx)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{isAr ? 'نسخ الأمر' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code dir="ltr" className="block text-xs font-mono text-emerald-400 break-all select-all">
                    {item.cmd}
                  </code>
                </div>
              ))}
            </div>

            {/* Copy all commands together */}
            <button
              type="button"
              onClick={() => copyCommand(allInOneCommand, 99)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
            >
              {copiedIndex === 99 ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">{isAr ? 'تم نسخ جميع الأوامر بنجاح!' : 'All commands copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>{isAr ? 'نسخ جميع أوامر الرفع دفعة واحدة' : 'Copy all commands'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنشاء مستودع جديد على GitHub' : 'Create new repo on GitHub'}</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#003865] hover:bg-[#002b49] text-white text-xs font-bold transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
