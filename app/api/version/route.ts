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
    version: "1.0.18",
    versionCode: 19,
    releaseDate: "2026-10-20",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🗑️ Persistent Tombstone Tracking: Deleted study sessions are now tracked locally and permanently purged from the cloud database",
      "🛡️ Anti-Resurrection Cloud Sync: Prevents deleted sessions from reappearing during cloud sync and background polling",
      "⚡ Robust Deletion Authentication: Allows session deletion across guest, offline, and authenticated modes with user and metadata fallback",
      "🔄 Instant XP Synchronization: Deducts session XP locally and on the server with floor protection"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.18.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.18.apk",
    fileSizeMb: 4.1,
    sha256: "c57709d4809d5ed5e3ebd2bd39f22a3d234c59670510a748838a76eb19effd6d"
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
