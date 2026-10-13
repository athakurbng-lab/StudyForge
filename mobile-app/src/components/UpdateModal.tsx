import React, { useState } from 'react';
import { Rocket, Download, ExternalLink, X, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppReleaseInfo, UpdateService, CURRENT_VERSION } from '../services/updateService';

interface UpdateModalProps {
  release: AppReleaseInfo;
  onClose: () => void;
  onSnooze?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ release, onClose, onSnooze }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const isAlreadyUpToDate = UpdateService.getCurrentVersionCode() >= release.versionCode;

  const handleInstall = () => {
    setIsInstalling(true);
    setDownloadTriggered(true);
    UpdateService.snoozeUpdate(release.version);
    UpdateService.triggerInstall(release);
    setTimeout(() => {
      setIsInstalling(false);
    }, 3500);
  };

  const handleDismiss = () => {
    if (onSnooze) {
      UpdateService.snoozeUpdate(release.version);
      onSnooze();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isAlreadyUpToDate 
                ? 'bg-emerald-600 shadow-emerald-600/20' 
                : 'bg-gradient-to-tr from-rose-500 to-indigo-600 shadow-rose-500/20'
            }`}>
              {isAlreadyUpToDate ? <CheckCircle2 className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {isAlreadyUpToDate ? 'App is Up to Date!' : 'Update Available!'}
                </h3>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  v{release.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Current {CURRENT_VERSION} • {release.fileSizeMb || 4.1} MB APK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changelog Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 space-y-2 overflow-y-auto max-h-56">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              What's New in this Release
            </span>
            <span className="text-[10px] text-slate-400">
              {release.releaseDate}
            </span>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
            {release.changelog && release.changelog.length > 0 ? (
              release.changelog.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-[11px]">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-[11px] text-slate-400">General stability, sync and performance improvements.</li>
            )}
          </ul>
        </div>

        {/* Security & Verification Notice */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-[10px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Signed release APK verified with GitHub source hash integrity.</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {isAlreadyUpToDate ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>You're on the Latest Version (v{CURRENT_VERSION})</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isInstalling}
              onClick={handleInstall}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isInstalling ? (
                <>
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>Downloading & Opening Installer...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download & Install Update Now</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                </>
              )}
            </button>
          )}

          {downloadTriggered && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-left space-y-1 animate-in fade-in duration-200">
              <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <span>📥 APK Download Initiated in Browser!</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-indigo-700 dark:text-indigo-300">
                Check your phone's notification bar or Downloads app. Once downloaded, tap the APK and tap <strong>"Update"</strong> to complete installation.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1"
            >
              Remind Me Later
            </button>

            <a
              href={release.githubUrl || release.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 py-1"
            >
              <span>GitHub Release</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
