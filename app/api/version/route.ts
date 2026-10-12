import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.1",
    versionCode: 2,
    releaseDate: "2026-10-12",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🚀 In-App Self-Updating Engine (Automatic & On-Demand OTA)",
      "⚠️ Explicit live AI failure notification before offline fallback",
      "🎯 Daily XP goal customizable presets and cloud sync",
      "⚡ Streamlined 5-tab mobile navigation bar",
      "🛡️ Hardened database synchronization for streaks and scores"
    ],
    downloadUrl: "https://study-forge-five-pi.vercel.app/StudyForge-OS-v1.0.0.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    fileSizeMb: 4.4,
    sha256: "c1571bcfe8cf51e9eee04afe702ebd5a30054e3b2bcd7b86d07b9cdbdace2b23"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
