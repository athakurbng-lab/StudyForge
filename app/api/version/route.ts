import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.3",
    versionCode: 4,
    releaseDate: "2026-10-12",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🔑 Universal Google Gemini API Key support (classic AIza... & new AQ.Ab8... keys)",
      "👥 Friend Profiles & Watcher Permissions (inspect logs, view streaks & stats)",
      "🌐 Public vs Private Study Log toggles across all timers and session logs",
      "📬 Session Access Requests inbox with instant approve/reject actions",
      "📊 Interactive Activity & Focus Graph (7D, 14D, 30D with XP/Time toggles)",
      "🚀 In-App Self-Updating Engine (Automatic & On-Demand OTA)"
    ],
    downloadUrl: "https://study-forge-five-pi.vercel.app/StudyForge-OS-v1.0.0.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    fileSizeMb: 4.4,
    sha256: "943b435d20c8875851d9d6f76205405420ae7e505603bf809196dd5fd9e65fe2"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
