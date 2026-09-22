import { NextResponse } from 'next/server';
import { processRefreshPhase } from '@/app/actions/admin_refresh';

// Vercel Cron or any other external cron service will hit this endpoint
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, ensure CRON_SECRET is set and verified
    if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Call the server action that processes the phase
    const result = await processRefreshPhase();

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Cron refresh error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
