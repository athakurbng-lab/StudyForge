import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.9",
    versionCode: 10,
    releaseDate: "2026-10-13",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🚀 Update Loop Permanently Resolved: Dedicated versioned binary prevents CDN & download manager caching collisions",
      "🛡️ Smart Background OTA Check: Respects snoozed update state so the update modal never appears in a loop",
      "⚡ Clean Settings Update UX: Accurate up-to-date detection eliminates false reinstall prompts",
      "✨ NVIDIA Nemotron 3 Ultra 550B Free AI: Built-in free academic AI evaluator enabled by default with multi-tier fallback",
      "🎯 Pomodoro Floating Bar 5s Auto-Hide: Automatically collapses into a right-docked dot when idle"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.9.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.9.apk",
    fileSizeMb: 4.1,
    sha256: "29c3e8afc8f1ac8e93a29ad9ca707be6c57aa9829a6105db919a0f189e58e619"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
