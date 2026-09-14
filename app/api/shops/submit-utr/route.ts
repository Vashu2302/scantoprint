import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { shopId, utrNumber } = await req.json();

    if (!shopId || !utrNumber) {
      return NextResponse.json({ message: 'Shop ID and UTR are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('shops')
      .update({
        payment_utr: String(utrNumber).trim(),
        payment_verified: false,
        subscription_status: 'active',
      })
      .eq('id', shopId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'UTR saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}