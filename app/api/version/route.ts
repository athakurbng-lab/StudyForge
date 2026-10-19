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
    version: "1.0.15",
    versionCode: 16,
    releaseDate: "2026-10-19",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🔄 Instant Local Storage Cloud Sync: Automatically pushes all offline & unsynced study sessions to live database",
      "🌐 Universal Session API CORS: Added CORS & OPTIONS preflight support to /api/sessions and /api/user/goal",
      "📦 Offline Session Diagnostics: Settings view now shows pending sync counts, 1-tap manual sync & JSON backup tool",
      "⚡ Enhanced Auth Modal: Direct count and visual banner for offline sessions waiting to sync"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.15.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.15.apk",
    fileSizeMb: 4.1,
    sha256: "792178431490d1e60d30d5e4bf1eddc9c5480b60d764f88c8bdf06aa77acd5ef"
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
