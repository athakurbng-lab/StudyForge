import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  const versionData = {
    version: "1.0.10",
    versionCode: 11,
    releaseDate: "2026-10-13",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🌐 Cross-Origin (CORS) Fix: Full mobile WebView CORS compatibility for instant OTA updates",
      "⚡ Free NVIDIA Nemotron 3 Ultra 550B Fix: Unlocked database key access across Android devices",
      "🚀 Update Loop Resolved: Dedicated versioned binary prevents caching collisions",
      "🛡️ Smart Background Check: Respects snoozed update state so the update modal never appears in a loop",
      "🎯 Pomodoro Floating Bar 5s Auto-Hide: Automatically collapses into a right-docked dot when idle"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.10.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.10.apk",
    fileSizeMb: 4.1,
    sha256: "1e839f56bcdbc84f7ad5a0263a603d646836ad869f7137415439fcca6fdec9a4"
  };

  return NextResponse.json(versionData, {
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
