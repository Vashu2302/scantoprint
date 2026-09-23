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
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. चेक करें कि OTP सही है और 10 मिनट के अंदर है
    const { data: record, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp', otp.trim())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !record) {
      return NextResponse.json({ error: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 });
    }

    // 2. पासवर्ड अपडेट करें (shops टेबल या Supabase Auth में)
    const { error: updateError } = await supabase
      .from('shops')
      .update({ password: newPassword })
      .eq('email', cleanEmail);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // 3. काम पूरा होने के बाद उपयोग किया गया OTP डिलीट कर दें
    await supabase.from('password_resets').delete().eq('email', cleanEmail);

    return NextResponse.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}