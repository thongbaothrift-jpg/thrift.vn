import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/site-texts`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({}, { status: 200 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
