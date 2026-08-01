import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

// Streams a private uploaded material file through to the browser. The browser navigates here
// directly (window.open), so this must be a real GET route (not JSON) that forwards the
// session cookie so the backend's workspace-ownership check on the file can run.
export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const cookie = req.headers.get('cookie') || '';

  const backendRes = await fetch(`${BACKEND_BASE_URL}/api/materials/file/${encodeURIComponent(fileId)}`, {
    headers: { cookie },
    cache: 'no-store',
  });

  if (!backendRes.ok || !backendRes.body) {
    const text = await backendRes.text().catch(() => '');
    return new NextResponse(text || 'File not found.', { status: backendRes.status });
  }

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: {
      'Content-Type': backendRes.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': backendRes.headers.get('content-disposition') || 'inline',
    },
  });
}
