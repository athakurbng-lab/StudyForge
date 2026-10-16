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
    version: "1.0.11",
    versionCode: 12,
    releaseDate: "2026-10-16",
    minSupportedVersion: "1.0.0",
    changelog: [
      "⏱️ Timer Duration Fix: Study session durations (e.g. 1h 45m, 2h 15m) are permanently preserved and never reset on cloud sync",
      "🌲 Ternary Bonsai 2 Architecture: Complete self-hosted Hugging Face Spaces free AI engine package with custom endpoints",
      "🔄 Smart Session Reconciler: Non-destructive local-to-cloud merge protects all user study records",
      "🌐 Dynamic AI Engine Switching: Full database and client support for custom self-hosted endpoints",
      "🚀 Update Loop Resolved: Dedicated versioned binary prevents caching collisions"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.11.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.11.apk",
    fileSizeMb: 4.1,
    sha256: "6f56639cd4f6508e377e444743c145f7fe2b2800444a3187954d86d0918277de"
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
