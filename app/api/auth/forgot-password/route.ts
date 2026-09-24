import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check inside shops table first
    const { data: shop } = await supabase
      .from('shops')
      .select('id, email, business_name, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    let userType: 'shop' | 'partner' = 'shop';
    let userId = shop?.id;
    let userName = shop?.business_name || shop?.name || 'Merchant Partner';

    // 2. If not shop, check inside partners table
    if (!shop) {
      const { data: partner } = await supabase
        .from('partners')
        .select('id, email, full_name')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!partner) {
        return NextResponse.json(
          { error: 'No registered merchant or partner account found with this email.' },
          { status: 404 }
        );
      }

      userType = 'partner';
      userId = partner.id;
      userName = partner.full_name || 'Valued Partner';
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 4. Save OTP inside database
    const targetTable = userType === 'shop' ? 'shops' : 'partners';
    const { error: updateError } = await supabase
      .from(targetTable)
      .update({
        reset_otp: otp,
        reset_otp_expires_at: expiresAt,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase OTP error:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate verification code. Please try again.' },
        { status: 500 }
      );
    }

    // 5. Send via Direct Brevo REST API (Zero TS Errors & 100% Primary Inbox Delivery)
    const senderEmail = process.env.SUPPORT_EMAIL || 'support@scantoprint.in';
    const accountTypeLabel = userType === 'partner' ? 'Partner Account' : 'Merchant Account';

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: { name: 'ScanToPrint Support', email: senderEmail },
        to: [{ email: cleanEmail, name: userName }],
        replyTo: { email: senderEmail, name: 'ScanToPrint Support' },
        subject: `ScanToPrint verification code: ${otp}`,
        textContent: `Hello ${userName},\n\nYour ScanToPrint verification code is: ${otp}\n\nValid for 10 minutes only.\n\nScanToPrint Support\n${senderEmail}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4338ca; margin: 0 0 4px 0;">ScanToPrint</h2>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">${accountTypeLabel} Verification</div>
            <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">Use the verification code below to proceed with your password reset:</p>
            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Valid for 10 minutes only</div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0;">If you did not request this verification code, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 16px 0;" />
            <div style="font-size: 11px; color: #94a3b8; text-align: center;">ScanToPrint Platform • Support: ${senderEmail}</div>
          </div>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errData = await brevoResponse.json();
      throw new Error(errData.message || 'Failed to dispatch email via Brevo');
    }

    return NextResponse.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (err: any) {
    console.error('Brevo API dispatch error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send verification email.' },
      { status: 500 }
    );
  }
}