import React, { useState } from 'react';
import { Key, Bell, Moon, Sun, Monitor, Info, CheckCircle2, AlertTriangle, Sparkles, Send, ShieldAlert, RefreshCw } from 'lucide-react';
import { UserSettings } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { NotificationService } from '../services/notificationService';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    const updated = { ...settings, geminiApiKey: apiKeyInput.trim() };
    onUpdateSettings(updated);
    setKeyTestStatus({
      success: true,
      message: 'Gemini API keys updated and safely saved.'
    });
  };

  const handleTestConnection = async () => {
    setIsTestingKey(true);
    setKeyTestStatus(null);
    const res = await GeminiService.testConnection(apiKeyInput);
    setKeyTestStatus(res);
    setIsTestingKey(false);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    const updated = { ...settings, theme };
    onUpdateSettings(updated);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await NotificationService.init();
      if (!granted) {
        setNotificationMsg('Notification permission was not granted by device.');
        return;
      }
    }
    const updated = { ...settings, notificationsEnabled: enabled };
    onUpdateSettings(updated);
    setNotificationMsg(enabled ? 'Notifications enabled!' : 'Notifications disabled.');
  };

  const handleTestInactivityNotification = async () => {
    setNotificationMsg('Sending test inactivity notification...');
    const ok = await NotificationService.triggerTestInactivityAlert();
    if (ok) {
      setNotificationMsg('Notification sent to device! Check your notification shade.');
    } else {
      setNotificationMsg('Failed to dispatch notification. Please check system permissions.');
    }
  };

  const handleTestFreezeNotification = async () => {
    const ok = await NotificationService.triggerFreezeTokenUsedAlert();
    if (ok) {
      setNotificationMsg('Freeze shield notification sent to device!');
    }
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors pb-24">
      <div>
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
          Settings & Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure Gemini AI keys, smart notifications, theme & version
        </p>
      </div>

      {/* 1. Gemini API Key Configuration Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Gemini AI API Configuration
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            {apiKeyInput.trim() ? 'Active Key Set' : 'Heuristic Mode (Add Key)'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Enter your Gemini API key (or multiple comma-separated keys) for live AI evaluations. If empty, the app runs locally with the built-in Academic Heuristic evaluation engine.
        </p>

        <div>
          <textarea
            rows={2}
            placeholder="Paste your AIzaSy... key(s) here"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveApiKey}
            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Save API Key
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isTestingKey}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTestingKey ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            )}
            <span>Test Connection</span>
          </button>
        </div>

        {/* Status Message */}
        {keyTestStatus && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              keyTestStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {keyTestStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="leading-tight">{keyTestStatus.message}</span>
          </div>
        )}
      </div>

      {/* 2. Theme Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Theme & Appearance
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              settings.theme === 'light'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>

          <button
            onClick={() => handleThemeChange('dark')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              settings.theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => handleThemeChange('system')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              settings.theme === 'system'
                ? 'border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 3. Smart Notifications Center */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Smart Notifications
            </h3>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Inactivity Alert Switch */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span>🔥 Inactivity Streak-Saver Alert</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Notifies you if you haven't logged study sessions today before midnight.
              </p>
            </div>
            <input
              type="time"
              value={settings.inactivityAlertTime || '20:30'}
              onChange={(e) => {
                const updated = { ...settings, inactivityAlertTime: e.target.value };
                onUpdateSettings(updated);
              }}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestInactivityNotification}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Test Inactivity Alert</span>
            </button>

            <button
              onClick={handleTestFreezeNotification}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900 rounded-lg hover:bg-sky-100 transition-colors"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Test Freeze Shield Alert</span>
            </button>
          </div>
        </div>

        {notificationMsg && (
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg">
            {notificationMsg}
          </p>
        )}
      </div>

      {/* 4. App Version Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Version & Architecture Details
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">App Name</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">StudyForge Mobile OS</div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Version</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">{settings.appVersion}</div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Build ID</span>
            <div className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">{settings.buildNumber}</div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Platform</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Android 13+ (Capacitor)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
