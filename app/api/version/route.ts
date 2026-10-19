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
    version: "1.0.13",
    versionCode: 14,
    releaseDate: "2026-10-19",
    minSupportedVersion: "1.0.0",
    changelog: [
      "🎯 10-Criteria Evaluation: Interactive self-rating sliders (1–10) across productivity, difficulty, accuracy, depth, mastery & impact",
      "⚡ Authentic XP Formula: Total XP = Focused Hours × Evaluation Marks (Sum of 10 criteria, 10–100)",
      "⏱️ Extended Study Sprints: Log up to 8 hours (480 minutes) with exact fractional hour XP scaling (e.g. 45m = 0.75h)",
      "🤖 Optional AI Auto-Scoring: Seamless toggle to analyze notes and auto-calibrate all 10 criteria"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.13.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.13.apk",
    fileSizeMb: 4.1,
    sha256: "9df7e12f354e727f5cd25e231fd0579cafdda5d2961122657a26501dc2f41c9c"
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
