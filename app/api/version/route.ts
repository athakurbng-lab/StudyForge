import { NextResponse } from 'next/server';

export async function GET() {
  const versionData = {
    version: "1.0.7",
    versionCode: 8,
    releaseDate: "2026-10-13",
    minSupportedVersion: "1.0.0",
    changelog: [
      "⚡ NVIDIA Nemotron 3 Ultra 550B Integration: Built-in, high-intelligence academic AI evaluator enabled for all users by default",
      "🛡️ Seamless Multi-Tier Fallback: Auto-falls back to personal Gemini/OpenRouter keys or local offline heuristics if shared quotas fill up",
      "🎯 Pomodoro Floating Bar 5s Auto-Hide: Automatically collapses into an unobtrusive floating dot docked to the right edge when idle",
      "✨ One-Tap Dot Expansion: Tap the right-docked floating dot to instantly restore the full timer bar with haptic feedback",
      "🚀 Startup & Wake Auto-Update Checking: Checks for updates automatically on app launch and wake",
      "📥 Direct GitHub Raw OTA Link: Ensures instantaneous, freshest binary delivery"
    ],
    downloadUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    githubUrl: "https://github.com/athakurbng-lab/StudyForge/raw/main/StudyForge-OS-v1.0.0.apk",
    fileSizeMb: 4.1,
    sha256: "6ebc87b4e417e5bc7fda63bcbaa072e86dab7aa0f766076d5eacf3ded2566e92"
  };

  return NextResponse.json(versionData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
