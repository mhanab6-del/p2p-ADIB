import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  CloudUpload,
  HardDrive,
  Search,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  Folder,
  RefreshCw,
  LogOut,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../lib/googleDriveAuth';
import {
  listDriveFiles,
  uploadFileToDrive,
  downloadDriveFile,
  deleteDriveFile,
  findOrCreateFolder,
  DriveFileItem,
} from '../lib/googleDriveApi';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
  getCurrentPdfBlob: () => Promise<Blob>;
  getCurrentImageBlob?: () => Promise<Blob>;
  onLoadFileToViewer: (file: File | Blob, name: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
  getCurrentPdfBlob,
  getCurrentImageBlob,
  onLoadFileToViewer,
}) => {
  const isAr = lang === 'ar';

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tabs: 'save' | 'browse' | 'account'
  const [activeTab, setActiveTab] = useState<'save' | 'browse' | 'account'>('save');

  // Save to Drive state
  const [saveFormat, setSaveFormat] = useState<'pdf' | 'image'>('pdf');
  const [customFileName, setCustomFileName] = useState('ADIB_Release_Letter_Mohamed_Abdulla_825983');
  const [useDedicatedFolder, setUseDedicatedFolder] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessFile, setUploadSuccessFile] = useState<DriveFileItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  // Browse files state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  // Destructive delete confirmation dialog state
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setAuthError(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setAccessToken(null);
      setDriveFiles([]);
    } catch (err: unknown) {
      console.error('Sign-out error:', err);
    }
  };

  // Fetch drive files
  const fetchFiles = useCallback(async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;

    setIsLoadingFiles(true);
    setBrowseError(null);
    try {
      const files = await listDriveFiles(token, {
        query: searchQuery,
        onlyPdfsAndImages: true,
      });
      setDriveFiles(files);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Drive files';
      setBrowseError(msg);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [accessToken, searchQuery]);

  // Load files when tab is switched to browse
  useEffect(() => {
    if (isOpen && activeTab === 'browse' && (currentUser || accessToken)) {
      fetchFiles();
    }
  }, [isOpen, activeTab, currentUser, accessToken, fetchFiles]);

  // Execute upload after confirmation
  const handleConfirmSaveToDrive = async () => {
    setShowSaveConfirmDialog(false);
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessFile(null);

    try {
      let token = accessToken;
      if (!token) {
        token = await getAccessToken();
      }
      if (!token) {
        const signRes = await googleSignIn();
        if (!signRes) throw new Error('Authentication required');
        token = signRes.accessToken;
        setCurrentUser(signRes.user);
        setAccessToken(token);
      }

      let blob: Blob;
      let extension = '.pdf';
      let mimeType = 'application/pdf';

      if (saveFormat === 'pdf') {
        blob = await getCurrentPdfBlob();
        extension = '.pdf';
        mimeType = 'application/pdf';
      } else {
        if (getCurrentImageBlob) {
          blob = await getCurrentImageBlob();
        } else {
          blob = await getCurrentPdfBlob();
        }
        extension = '.png';
        mimeType = 'image/png';
      }

      const finalName = customFileName.trim().endsWith(extension)
        ? customFileName.trim()
        : `${customFileName.trim()}${extension}`;

      let targetFolderId: string | undefined = undefined;
      if (useDedicatedFolder) {
        const folderName = isAr ? 'وثائق مصرف أبوظبي الإسلامي' : 'ADIB Certificates';
        targetFolderId = await findOrCreateFolder(token, folderName);
      }

      const uploaded = await uploadFileToDrive(token, {
        name: finalName,
        mimeType,
        blob,
        folderId: targetFolderId,
      });

      setUploadSuccessFile(uploaded);
    } catch (err: unknown) {
      console.error('Upload to Drive failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Import file from Google Drive to viewer
  const handleOpenFileInViewer = async (file: DriveFileItem) => {
    setLoadingFileId(file.id);
    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('No access token');

      const { blob } = await downloadDriveFile(token, file.id);
      onLoadFileToViewer(blob, file.name);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to open file from Drive:', err);
      alert(isAr ? 'تعذر تحميل الملف من Google Drive' : 'Failed to download file from Google Drive');
    } finally {
      setLoadingFileId(null);
    }
  };

  // Delete file after explicit user confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('No access token');

      await deleteDriveFile(token, fileToDelete.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      alert(isAr ? 'تعذر حذف الملف من Google Drive' : 'Failed to delete file from Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="google-drive-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        id="google-drive-modal-card"
        className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#002b49]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md shrink-0">
              <svg viewBox="0 0 87.3 78" className="w-full h-full">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.1 10.55z" fill="#ea4335"/>
                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
                <path d="M59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z" fill="#ffba00"/>
                <path d="M73.55 76.8H27.5L13.75 53h59.8c0 1.55-.4 3.1-1.2 4.5z" fill="#2684fc"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {isAr ? 'خدمة Google Drive' : 'Google Drive Integration'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  {isAr ? 'سحابي مباشر' : 'Cloud Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'حفظ شهادات وبراءات ذمة ADIB في حسابك السحابي أو استعراض مستنداتك'
                  : 'Save authentic certificates to Drive or browse your cloud documents'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-drive-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Bar / Sign-in Banner */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google User'}
                  className="w-7 h-7 rounded-full ring-2 ring-emerald-500/60 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {currentUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <span className="font-medium text-white block leading-tight">
                  {currentUser.displayName || (isAr ? 'مستخدم Google' : 'Google User')}
                </span>
                <span className="text-slate-400 text-[11px] block">{currentUser.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isAr
                  ? 'قم بتسجيل الدخول باستخدام Google للمزامنة المباشرة مع مساحتك'
                  : 'Sign in with Google to sync directly with your Drive storage'}
              </span>
            </div>
          )}

          {currentUser ? (
            <button
              id="btn-drive-signout"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-200 border border-slate-700 transition cursor-pointer text-xs"
              title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          ) : (
            /* Official Google Sign-In Button compliant with Google Identity Guidelines */
            <button
              id="btn-google-drive-signin"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              title={isAr ? 'تسجيل الدخول باستخدام حساب Google' : 'Sign in with Google'}
            >
              {isSigningIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              <span>{isAr ? 'تسجيل الدخول بـ Google' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>

        {authError && (
          <div className="px-5 py-2 bg-red-950/50 border-b border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            id="tab-drive-save"
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'save'
                ? 'border-[#c5a059] text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isAr ? 'حفظ الشهادة في Google Drive' : 'Save Certificate to Drive'}</span>
          </button>

          <button
            id="tab-drive-browse"
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'browse'
                ? 'border-[#c5a059] text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>{isAr ? 'استعراض مستندات Drive' : 'Browse Drive Documents'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SAVE TO GOOGLE DRIVE */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'تصدير الوثيقة الحالية إلى Google Drive' : 'Export Current Certificate to Drive'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr
                    ? 'سيتم رفع شهادة براءة الذمة الرسمية بكامل خصائصها الأمنية المعتمدة وختم التوثيق مباشرة إلى مساحة Google Drive الخاصة بك لتتمكن من أرشفتها ومشاركتها والرجوع إليها في أي وقت.'
                    : 'The authentic clearance certificate will be uploaded directly to your Google Drive with all security stamps and validation data intact.'}
                </p>

                {/* Format selection */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? 'صيغة الحفظ:' : 'Export Format:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSaveFormat('pdf')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        saveFormat === 'pdf'
                          ? 'bg-[#003865] border-amber-400/80 text-white shadow-sm ring-1 ring-amber-400/40'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-red-400" />
                      <span>{isAr ? 'ملف PDF معتمد (موصى به)' : 'Certified PDF (Recommended)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveFormat('image')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        saveFormat === 'image'
                          ? 'bg-[#003865] border-amber-400/80 text-white shadow-sm ring-1 ring-amber-400/40'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      <span>{isAr ? 'صورة فائقة الدقة (PNG)' : 'High-Res Image (PNG)'}</span>
                    </button>
                  </div>
                </div>

                {/* File name input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'اسم الملف في Google Drive:' : 'Drive File Name:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      placeholder="ADIB_Certificate"
                    />
                    <span className="text-xs text-slate-400 font-mono">
                      {saveFormat === 'pdf' ? '.pdf' : '.png'}
                    </span>
                  </div>
                </div>

                {/* Folder organization toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-dedicated-folder"
                    checked={useDedicatedFolder}
                    onChange={(e) => setUseDedicatedFolder(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chk-dedicated-folder" className="text-xs text-slate-200 cursor-pointer select-none">
                    {isAr
                      ? 'إنشاء مجلد منظم باسم "وثائق مصرف أبوظبي الإسلامي" في Drive'
                      : 'Save inside organized folder "ADIB Certificates" in Drive'}
                  </label>
                </div>
              </div>

              {/* Upload Action Button */}
              <div>
                <button
                  id="btn-start-drive-upload"
                  onClick={() => setShowSaveConfirmDialog(true)}
                  disabled={isUploading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#c5a059] to-amber-500 hover:from-amber-500 hover:to-[#c5a059] text-slate-950 font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{isAr ? 'جاري الرفع إلى Google Drive...' : 'Uploading to Google Drive...'}</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 text-slate-950" />
                      <span>{isAr ? 'حفظ الشهادة الآن في Google Drive' : 'Save Certificate to Google Drive Now'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Result Box */}
              {uploadSuccessFile && (
                <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{isAr ? 'تم حفظ الوثيقة بنجاح في Google Drive!' : 'Document successfully saved to Google Drive!'}</span>
                  </div>
                  <div className="text-xs space-y-1 text-emerald-100 bg-slate-950/40 p-2.5 rounded-lg border border-emerald-600/30">
                    <p><span className="text-emerald-400 font-semibold">{isAr ? 'اسم الملف:' : 'File name:'}</span> {uploadSuccessFile.name}</p>
                    {uploadSuccessFile.size && (
                      <p><span className="text-emerald-400 font-semibold">{isAr ? 'الحجم:' : 'Size:'}</span> {(parseInt(uploadSuccessFile.size) / 1024).toFixed(1)} KB</p>
                    )}
                  </div>
                  {uploadSuccessFile.webViewLink && (
                    <a
                      href={uploadSuccessFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isAr ? 'فتح ومعاينة الملف في Google Drive' : 'Open in Google Drive'}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Error Message Box */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BROWSE & IMPORT FROM DRIVE */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              {/* Search & Refresh Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
                    placeholder={isAr ? 'بحث في ملفات Drive (PDF، صور)...' : 'Search Drive files (PDF, images)...'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchFiles}
                  disabled={isLoadingFiles}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title={isAr ? 'تحديث القائمة' : 'Refresh list'}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>

              {/* Not Signed In Notice */}
              {!currentUser && !accessToken && (
                <div className="p-6 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <CloudUpload className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    {isAr
                      ? 'للوصول إلى ملفاتك في Google Drive وفتحها في عارض الشهادات، يرجى تسجيل الدخول بحساب Google أولاً.'
                      : 'Please sign in with Google to view and import documents stored in your Google Drive.'}
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs shadow hover:bg-slate-100 transition cursor-pointer"
                  >
                    <span>{isAr ? 'تسجيل الدخول بـ Google' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoadingFiles && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c5a059]" />
                  <span>{isAr ? 'جاري جلب الملفات من Google Drive...' : 'Fetching files from Google Drive...'}</span>
                </div>
              )}

              {/* Browse Error */}
              {browseError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{browseError}</span>
                </div>
              )}

              {/* Files List */}
              {!isLoadingFiles && (currentUser || accessToken) && (
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                  {driveFiles.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {isAr ? 'لم يتم العثور على ملفات PDF أو صور في Google Drive.' : 'No PDF or image files found in Google Drive.'}
                    </div>
                  ) : (
                    driveFiles.map((file) => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      const isPdf = file.mimeType === 'application/pdf';
                      const isImage = file.mimeType.startsWith('image/');

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {isFolder ? (
                              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : isPdf ? (
                              <FileText className="w-4 h-4 text-red-400 shrink-0" />
                            ) : isImage ? (
                              <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-white block truncate" title={file.name}>
                                {file.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {file.size && <span>{(parseInt(file.size) / 1024).toFixed(0)} KB</span>}
                                {file.modifiedTime && (
                                  <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Open in Viewer Button */}
                            {!isFolder && (
                              <button
                                type="button"
                                onClick={() => handleOpenFileInViewer(file)}
                                disabled={loadingFileId === file.id}
                                className="px-2.5 py-1 rounded bg-[#003865] hover:bg-[#002b49] text-amber-300 border border-amber-400/40 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title={isAr ? 'عرض هذا الملف داخل التطبيق' : 'Open and inspect in viewer'}
                              >
                                {loadingFileId === file.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                                ) : (
                                  <FolderOpen className="w-3.5 h-3.5" />
                                )}
                                <span>{isAr ? 'عرض' : 'View'}</span>
                              </button>
                            )}

                            {/* Open in Google Drive Link */}
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                title={isAr ? 'فتح في موقع Google Drive' : 'Open in Google Drive'}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Delete File Button (Triggers mandatory user confirmation) */}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition cursor-pointer"
                              title={isAr ? 'حذف الملف من Drive' : 'Delete file from Drive'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'اتصال موثّق مع واجهة برمجة Google Workspace الرسمية' : 'Official Google Workspace Drive API'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL FOR UPLOADING/CREATING DATA */}
      {showSaveConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {isAr ? 'تأكيد الحفظ في Google Drive' : 'Confirm Google Drive Upload'}
                </h4>
                <p className="text-xs text-slate-300">
                  {isAr ? 'هل ترغب برفع هذا المستند إلى حسابك في Google Drive؟' : 'Upload this certificate file to your Google Drive?'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <p className="text-slate-300">
                <span className="font-semibold text-amber-400">{isAr ? 'الملف:' : 'File:'}</span>{' '}
                {customFileName}{saveFormat === 'pdf' ? '.pdf' : '.png'}
              </p>
              <p className="text-slate-300">
                <span className="font-semibold text-amber-400">{isAr ? 'الصيغة:' : 'Format:'}</span>{' '}
                {saveFormat === 'pdf' ? 'PDF Document' : 'PNG Image'}
              </p>
              {useDedicatedFolder && (
                <p className="text-slate-300">
                  <span className="font-semibold text-amber-400">{isAr ? 'المجلد:' : 'Folder:'}</span>{' '}
                  {isAr ? 'وثائق مصرف أبوظبي الإسلامي' : 'ADIB Certificates'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSaveConfirmDialog(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveToDrive}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#c5a059] to-amber-500 hover:from-amber-500 hover:to-[#c5a059] text-slate-950 text-xs font-bold cursor-pointer shadow-md"
              >
                {isAr ? 'تأكيد الرفع والمزامنة' : 'Confirm & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION MODAL FOR DESTRUCTIVE DELETION (Google Workspace Guidelines) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {isAr ? 'تأكيد حذف الملف من Google Drive' : 'Confirm File Deletion from Drive'}
                </h4>
                <p className="text-xs text-red-300">
                  {isAr
                    ? 'هذا الإجراء سيقوم بحذف الملف من مساحة Google Drive الخاصة بك نهائياً.'
                    : 'This action will permanently delete the file from your Google Drive.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-400">{isAr ? 'الملف المراد حذفه:' : 'File to delete:'}</span>{' '}
              <span className="text-white font-mono">{fileToDelete.name}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
