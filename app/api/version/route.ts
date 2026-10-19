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
    version: "1.0.14",
    versionCode: 15,
    releaseDate: "2026-10-19",
    minSupportedVersion: "1.0.0",
    changelog: [
      "👥 Friend & Self Profile Access: Full study profile & session log viewer directly from avatar, settings, and group leaderboards",
      "🌐 Cross-Origin & Preflight Fix: Added explicit CORS & OPTIONS support to user profile, watcher, and access request endpoints",
      "🔍 Case-Insensitive User Search: Friend search and watcher requests now effortlessly match usernames and display names regardless of casing",
      "⚡ Enhanced Group Leaderboard: Entire leaderboard row is now clickable to seamlessly inspect friends' study history"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.14.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.14.apk",
    fileSizeMb: 4.1,
    sha256: "6985c0577b0a0dcb328fa57797563ea815ef5dfcda257c09ea4c867dea11ffaa"
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
