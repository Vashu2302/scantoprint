import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role or anon client with full authority
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, utrNumber } = body;

    console.log('[SUBMIT_UTR] Received for shop:', shopId, 'UTR:', utrNumber);

    if (!shopId || !utrNumber) {
      return NextResponse.json(
        { message: 'Shop ID and UTR Number are mandatory' },
        { status: 400 }
      );
    }

    const cleanUtr = String(utrNumber).trim();

    const { data, error } = await supabaseAdmin
      .from('shops')
      .update({
        payment_utr: cleanUtr,
        payment_verified: false,
        subscription_status: 'active',
      })
      .eq('id', shopId)
      .select('id, payment_utr');

    if (error) {
      console.error('[SUBMIT_UTR_DB_ERROR]:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    console.log('[SUBMIT_UTR_SUCCESS]:', data);
    return NextResponse.json({
      success: true,
      message: 'UTR saved successfully',
      data,
    });
  } catch (err: any) {
    console.error('[SUBMIT_UTR_SERVER_ERROR]:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}