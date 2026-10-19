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
    version: "1.0.17",
    versionCode: 18,
    releaseDate: "2026-10-20",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🛡️ Sync Idempotency Guard: Server now prevents duplicate study sessions from being recorded in the database when syncing",
      "⚡ Concurrency Lock & In-Flight Tracking: Eliminates overlapping sync uploads and prevents duplicate session generation",
      "🔄 Non-Destructive 1-to-1 Cloud Reconciliation: Merges local and cloud records with strict deduplication by cloud ID, local ID, and fuzzy content",
      "🧹 Automatic Local Storage Deduplication: Cleans existing duplicate records and restores accurate XP balances on startup"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.17.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.17.apk",
    fileSizeMb: 4.1,
    sha256: "58bad817136810435b2f959260c3b9ff60599d81d2be96d25f3df4111762dde0"
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
