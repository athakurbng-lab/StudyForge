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
    version: "1.0.12",
    versionCode: 13,
    releaseDate: "2026-10-16",
    minSupportedVersion: "1.0.0",
    changelog: [
      "⚡ Instant AI Evaluation: Connected Groq GPT OSS 120B ultra-fast reasoning engine",
      "🛡️ Server Proxy Evaluator: Bypasses Android WebView CORS/network restrictions with direct datacenter speed",
      "⏱️ Non-Blocking Button: Strict 4.2s hard ceiling timeout guarantees evaluation button never hangs or becomes irresponsive",
      "⏱️ Timer Duration Fix: Study session durations (e.g. 1h 45m, 2h 15m) are permanently preserved across cloud syncs"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.12.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.12.apk",
    fileSizeMb: 4.1,
    sha256: "2c32b300c7292f294e87104317d3cf18de578a360bb03d268076fb1355733c78"
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
