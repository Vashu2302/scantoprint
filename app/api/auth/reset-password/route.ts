import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. Check shopkeeper first
    const { data: shop } = await supabase
      .from('shops')
      .select('id, reset_otp, reset_otp_expires_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (shop) {
      if (!shop.reset_otp || shop.reset_otp !== cleanOtp) {
        return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
      }
      if (new Date(shop.reset_otp_expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Verification code has expired.' }, { status: 400 });
      }

      await supabase
        .from('shops')
        .update({
          password: newPassword.trim(),
          plain_password: newPassword.trim(),
          reset_otp: null,
          reset_otp_expires_at: null,
        })
        .eq('id', shop.id);

      return NextResponse.json({ success: true, message: 'Password reset successful!' });
    }

    // 2. Check partner
    const { data: partner } = await supabase
      .from('partners')
      .select('id, reset_otp, reset_otp_expires_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (partner) {
      if (!partner.reset_otp || partner.reset_otp !== cleanOtp) {
        return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
      }
      if (new Date(partner.reset_otp_expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Verification code has expired.' }, { status: 400 });
      }

      await supabase
        .from('partners')
        .update({
          password: newPassword.trim(),
          reset_otp: null,
          reset_otp_expires_at: null,
        })
        .eq('id', partner.id);

      return NextResponse.json({ success: true, message: 'Password reset successful!' });
    }

    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset failed.' }, { status: 500 });
  }
}