import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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

    // 2. If no be shop, check inside partners table
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

    // 5. Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const accountTypeLabel = userType === 'partner' ? 'Partner Account' : 'Merchant Account';

    // Send email wit correct anti-spam headers
    await transporter.sendMail({
      from: `"ScanToPrint" <${process.env.SUPPORT_EMAIL}>`,
      to: cleanEmail,
      replyTo: process.env.SUPPORT_EMAIL,
      subject: `ScanToPrint verification code: ${otp}`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'ScanToPrint Mailer',
      },
      text: `Hello ${userName},\n\nYour password reset verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nScanToPrint Support\n${process.env.SUPPORT_EMAIL}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <div style="margin-bottom: 24px;">
              <h2 style="margin: 0; color: #4338ca; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ScanToPrint</h2>
              <span style="font-size: 12px; color: #64748b;">${accountTypeLabel} Verification</span>
            </div>

            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
              Hello <strong>${userName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #475569;">
              We received a request to reset your password. Use the verification code below to proceed:
            </p>

            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; display: block;">
                ${otp}
              </span>
              <span style="display: block; font-size: 11px; color: #64748b; margin-top: 6px; font-weight: 500;">
                Valid for 10 minutes only
              </span>
            </div>

            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 24px 0;">
              If you did not request this verification code, you can safely ignore this email.
            </p>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
              ScanToPrint Platform • Support: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #6366f1; text-decoration: none;">${process.env.SUPPORT_EMAIL}</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (err: any) {
    console.error('Nodemailer error:', err);
    return NextResponse.json(
      { error: err.message || 'SMTP Authentication Failed. Check App Password.' },
      { status: 500 }
    );
  }
}