import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, utrNumber } = body;

    if (!shopId || !utrNumber) {
      return NextResponse.json(
        { message: 'Shop ID and UTR Number are mandatory' },
        { status: 400 }
      );
    }

    const cleanUtr = String(utrNumber).trim();

    const { data: shop, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (fetchError || !shop) {
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    const isPremium = String(shop.plan_type || '').toLowerCase() === 'premium';
    const basePrice = isPremium ? 249 : 149;
    const hasPromo = Boolean(shop.referred_by_code && String(shop.referred_by_code).trim() !== '');
    const finalAmount = hasPromo ? (isPremium ? 199 : 119) : basePrice;

    const { data, error } = await supabaseAdmin
      .from('shops')
      .update({
        payment_utr: cleanUtr,
        payment_verified: false,
        subscription_status: 'active',
        paid_amount: finalAmount,
      })
      .eq('id', shopId)
      .select();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'UTR saved successfully',
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}