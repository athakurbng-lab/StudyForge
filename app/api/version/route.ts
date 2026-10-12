import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.5",
    versionCode: 6,
    releaseDate: "2026-10-12",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🚀 Startup & Resume Auto-Update Check: The app checks GitHub releases immediately upon launch and wake",
      "📥 Direct GitHub Raw OTA Link: Bypasses stale web caches to guarantee the freshest binary is installed",
      "⏱️ Background Pomodoro & Stopwatch Immunity: Real wall-clock timestamp synchronization",
      "🔔 Native Scheduled Notifications when Pomodoro finishes while phone is asleep",
      "💾 Persistent Timer State Restoration if app is closed or process is recycled",
      "🔑 Universal Google Gemini API Key support (classic AIza... & new AQ.Ab8... keys)"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    fileSizeMb: 4.4,
    sha256: "23f071112bcb38b90b032e3ab6cb6965d5aefe95500612b89f1b4ebeeb5366e5"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
