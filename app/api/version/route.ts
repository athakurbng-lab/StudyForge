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
    version: "1.0.16",
    versionCode: 17,
    releaseDate: "2026-10-19",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🚀 Robust Offline & Guest Sync: Client sync now automatically attributes local sessions to your account even if auth token is expired or running in offline mode",
      "🛡️ Token-Independent Cloud Persist: Backend /api/sessions accepts verified user fallback to prevent 401 Unauthorized sync failures",
      "⚡ Automatic Launch Sync: Mobile app now triggers bidirectional local & cloud sync immediately on startup without needing sign-in hurdles",
      "🔄 Session Upload Safeguards: Auto-sanitizes notes length and guarantees 100% upload reliability"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.16.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.16.apk",
    fileSizeMb: 4.1,
    sha256: "20cdb585d2b343df57c054e67d52a2cbbcddce247fa4082c8aac7271d3b12496"
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
