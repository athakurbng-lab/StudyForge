export interface AppReleaseInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  changelog: string[];
  downloadUrl: string;
  githubUrl: string;
  fileSizeMb?: number;
  sha256?: string;
}

export const CURRENT_VERSION = 'v1.0.13';
export const CURRENT_VERSION_CODE = 14;
export const CURRENT_BUILD_NUMBER = '2026.10.19-v14';

const PRIMARY_VERSION_URL = 'https://study-forge-five-pi.vercel.app/api/version';
const FALLBACK_VERSION_URL = 'https://raw.githubusercontent.com/athakurbng-lab/StudyForge/main/version.json';

const SNOOZED_UPDATE_KEY = 'sf_snoozed_update_version';

export const UpdateService = {
  getCurrentVersion(): string {
    return CURRENT_VERSION;
  },

  getCurrentVersionCode(): number {
    return CURRENT_VERSION_CODE;
  },

  async checkForUpdate(forceCheck = false): Promise<{ hasUpdate: boolean; release?: AppReleaseInfo; error?: string }> {
    try {
      const cacheBust = `?t=${Date.now()}`;
      let data: AppReleaseInfo | null = null;

      // 1. Try primary server endpoint first (with full CORS headers & OPTIONS support)
      try {
        const res = await fetch(`${PRIMARY_VERSION_URL}${cacheBust}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn('Primary version check failed, trying GitHub raw fallback:', err);
      }

      // 2. Fallback to GitHub raw version.json
      if (!data) {
        try {
          const res = await fetch(`${FALLBACK_VERSION_URL}${cacheBust}`);
          if (res.ok) {
            data = await res.json();
          }
        } catch (err) {
          console.warn('GitHub raw version check failed:', err);
        }
      }

      if (!data || typeof data.versionCode !== 'number') {
        return { hasUpdate: false, error: 'Could not connect to update server.' };
      }

      const hasUpdate = data.versionCode > CURRENT_VERSION_CODE;

      // Check if snoozed unless user explicitly clicked "Check for Updates"
      if (!forceCheck && hasUpdate) {
        const snoozed = localStorage.getItem(SNOOZED_UPDATE_KEY);
        if (snoozed === data.version) {
          return { hasUpdate: false, release: data };
        }
      }

      return { hasUpdate, release: data };
    } catch (err: any) {
      return { hasUpdate: false, error: err?.message || 'Network error checking for updates.' };
    }
  },

  snoozeUpdate(version: string): void {
    localStorage.setItem(SNOOZED_UPDATE_KEY, version);
  },

  clearSnoozedUpdate(): void {
    localStorage.removeItem(SNOOZED_UPDATE_KEY);
  },

  triggerInstall(release: AppReleaseInfo): void {
    const fileName = `StudyForge-OS-v${release.version}.apk`;
    // Snooze this version so background checks during/after downloading do not re-prompt
    this.snoozeUpdate(release.version);

    // Prioritize direct GitHub raw URL with cache buster
    const baseUrl = release.githubUrl || release.downloadUrl || 'https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.10.apk';
    const separator = baseUrl.includes('?') ? '&' : '?';
    const targetUrl = `${baseUrl}${separator}v=${release.versionCode}&t=${Date.now()}`;

    try {
      // 1. Native Android Installer Bridge (via DownloadManager + FileProvider)
      if ((window as any).AndroidUpdater && typeof (window as any).AndroidUpdater.downloadAndInstall === 'function') {
        (window as any).AndroidUpdater.downloadAndInstall(targetUrl, fileName);
        return;
      }

      // 2. Open Android system download manager / browser via Capacitor '_system'
      const win = window.open(targetUrl, '_system');
      if (!win) {
        // Fallback only if window.open did not execute
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = fileName;
        a.target = '_system';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.warn('Native install trigger error, opening direct link:', err);
      window.open(targetUrl, '_system');
    }
  }
};
