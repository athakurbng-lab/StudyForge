import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.6",
    versionCode: 7,
    releaseDate: "2026-10-12",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🎯 Pomodoro Floating Bar 5s Auto-Hide: Automatically collapses into an unobtrusive floating dot docked to the right edge when idle",
      "✨ One-Tap Dot Expansion: Tap the right-docked floating dot to instantly restore the full timer bar with haptic feedback",
      "🚀 Startup & Wake Auto-Update Checking: The app checks for new updates on launch and screen resume",
      "📥 Direct GitHub Raw OTA Link: Bypasses stale web caches to guarantee the freshest binary is installed",
      "⏱️ Background Pomodoro & Stopwatch Wall-Clock Sync",
      "🔔 Native Scheduled Notifications when Pomodoro finishes while phone is asleep"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    fileSizeMb: 4.1,
    sha256: "a46894acf629358dc6f94d5b86fe35fd4bf7aacc4e2d39c72a87b59a0e65b116"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
