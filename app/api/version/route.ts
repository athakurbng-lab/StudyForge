import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.4",
    versionCode: 5,
    releaseDate: "2026-10-12",
    minSupportedVersion: "1.0.0",
    changelog: [
      "⏱️ Background Pomodoro & Stopwatch Immunity: Real wall-clock timestamp synchronization that never stops when screen is off or phone locks",
      "🔔 Native Scheduled Notifications when Pomodoro finishes while phone is asleep",
      "💾 Persistent Timer State Restoration if app is closed or process is recycled",
      "🔑 Universal Google Gemini API Key support (classic AIza... & new AQ.Ab8... keys)",
      "👥 Friend Profiles & Watcher Permissions (inspect logs, view streaks & stats)",
      "🌐 Public vs Private Study Log toggles across all timers and session logs"
    ],
    downloadUrl: "https://study-forge-five-pi.vercel.app/StudyForge-OS-v1.0.0.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    fileSizeMb: 4.4,
    sha256: "073e552955198a54c6febf5d95641f4ce2e55342aebdd3808e3e6ced82d1971f"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
