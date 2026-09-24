import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, referralCode, upiId } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing required details.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const cleanEmail = email.trim().toLowerCase();

    // Plain text version for spam prevention
    const plainText = `Hello ${fullName},\n\nWelcome to the ScanToPrint Partner Program!\n\nYour Partner Details:\n- Referral Promo Code: ${referralCode}\n- Registered Phone (Login ID): ${phone}\n- Settlement UPI ID: ${upiId}\n\nEarning Structure:\n- ₹100 direct commission on Standard plan subscriptions\n- ₹150 direct commission on Premium plan subscriptions\n\nLogin to your partner dashboard: https://scantoprint.in/partner/login\n\nScanToPrint Support\nscantoprint.support@gmail.com`;

    await transporter.sendMail({
      from: `"ScanToPrint" <${process.env.SUPPORT_EMAIL}>`,
      to: cleanEmail,
      subject: `Welcome to ScanToPrint Partner Program, ${fullName}`,
      text: plainText,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ScanToPrint</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <div style="margin-bottom: 24px;">
              <h2 style="margin: 0; color: #4338ca; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ScanToPrint</h2>
              <span style="font-size: 12px; color: #64748b;">Partner Onboarding</span>
            </div>

            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 14px 0; color: #334155;">
              Hello <strong>${fullName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #475569;">
              Welcome to the ScanToPrint Partner Program. Your account is active, and you can now start onboarding print and photocopy shops in your area.
            </p>

            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #4338ca; letter-spacing: 0.5px; display: block; margin-bottom: 10px;">
                Account Summary
              </span>
              <p style="margin: 6px 0; font-size: 13px; color: #334155;">
                <strong>Promo Code:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${referralCode}</span>
              </p>
              <p style="margin: 6px 0; font-size: 13px; color: #334155;">
                <strong>Login ID:</strong> <span style="font-family: monospace;">${phone}</span>
              </p>
              <p style="margin: 6px 0; font-size: 13px; color: #334155;">
                <strong>Settlement UPI:</strong> <span style="font-family: monospace; color: #059669;">${upiId}</span>
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <span style="font-size: 12px; font-weight: 700; color: #0f172a; display: block; margin-bottom: 8px;">
                Earning Structure
              </span>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.6;">
                <li><strong>₹100 commission</strong> per Standard plan subscription</li>
                <li><strong>₹150 commission</strong> per Premium plan subscription</li>
                <li>Direct monthly payouts to your registered UPI ID</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 24px 0 16px 0;">
              <a href="https://scantoprint.in/partner/login" style="background-color: #4338ca; color: #ffffff; padding: 10px 24px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">
                Open Partner Dashboard
              </a>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
              ScanToPrint Partner Support • <a href="mailto:scantoprint.support@gmail.com" style="color: #6366f1; text-decoration: none;">scantoprint.support@gmail.com</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, message: 'Welcome email sent successfully.' });
  } catch (err: any) {
    console.error('Welcome email error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}