import { NextResponse } from 'next/server';

const ALLOWED_PATHS = ['/api/status', '/api/config', '/api/wallets', '/api/positions', '/api/trades'];

function getMcApiUrl(): string {
  return process.env.MC_API_URL || 'http://127.0.0.1:3091';
}

function verifyAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.API_SECRET || process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

function validatePath(path: string): NextResponse | null {
  // Block path traversal, encoded chars, and query strings
  if (path.includes('..') || path.includes('%') || path.includes('?') || path.includes('#')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  // Strict match: must exactly equal an allowed path or be a direct sub-path
  if (!ALLOWED_PATHS.some(allowed => path === allowed || path.startsWith(allowed + '/'))) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = verifyAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/api/status';

  const pathDenied = validatePath(path);
  if (pathDenied) return pathDenied;

  try {
    const res = await fetch(`${getMcApiUrl()}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'MC unreachable' }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  const denied = verifyAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  const pathDenied = validatePath(path);
  if (pathDenied) return pathDenied;

  try {
    const body = await request.json();
    const res = await fetch(`${getMcApiUrl()}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'MC unreachable' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const denied = verifyAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  const pathDenied = validatePath(path);
  if (pathDenied) return pathDenied;

  try {
    const body = await request.json();
    const res = await fetch(`${getMcApiUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'MC unreachable' }, { status: 502 });
  }
}
