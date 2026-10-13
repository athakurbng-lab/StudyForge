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

export const CURRENT_VERSION = 'v1.0.8';
export const CURRENT_VERSION_CODE = 9;
export const CURRENT_BUILD_NUMBER = '2026.10.13-v9';

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

      // 1. Try direct GitHub raw URL first (instantaneous upon push)
      try {
        const res = await fetch(`${FALLBACK_VERSION_URL}${cacheBust}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn('GitHub raw version check failed, trying server endpoint:', err);
      }

      // 2. Fallback to primary server endpoint
      if (!data) {
        try {
          const res = await fetch(`${PRIMARY_VERSION_URL}${cacheBust}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
            data = await res.json();
          }
        } catch (err) {
          console.warn('Primary version check failed:', err);
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
    // Prioritize direct GitHub raw URL with cache buster so stale CDNs or browser caches never serve an old APK
    const baseUrl = release.githubUrl || release.downloadUrl || 'https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk';
    const separator = baseUrl.includes('?') ? '&' : '?';
    const targetUrl = `${baseUrl}${separator}v=${release.versionCode}&t=${Date.now()}`;

    try {
      // 1. Native Android Installer Bridge (via DownloadManager + FileProvider)
      if ((window as any).AndroidUpdater && typeof (window as any).AndroidUpdater.downloadAndInstall === 'function') {
        (window as any).AndroidUpdater.downloadAndInstall(targetUrl, fileName);
        return;
      }

      // 2. Open Android system download manager / browser via Capacitor '_system'
      window.open(targetUrl, '_system');

      // 3. Fallback anchor click
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = fileName;
      a.target = '_system';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn('Native install trigger error, opening direct link:', err);
      window.open(targetUrl, '_system');
    }
  }
};
