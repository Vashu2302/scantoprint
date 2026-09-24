import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, referralCode, upiId } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing required details.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const senderEmail = process.env.SUPPORT_EMAIL || 'scantoprint.support@gmail.com';

    const plainText = `Hello ${fullName},\n\nYour ScanToPrint Partner account has been activated successfully.\n\nAccount Details:\n- Referral Code: ${referralCode}\n- Registered ID: ${phone}\n- Linked UPI: ${upiId}\n\nYou can access your portal here: https://scantoprint.in/partner/login\n\nBest regards,\nScanToPrint Team\n${senderEmail}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Confirmation</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1e293b;">
        <div style="max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          
          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0; color: #4338ca; font-size: 20px; font-weight: 700;">ScanToPrint</h2>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Partner Account Confirmation</div>
          </div>

          <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
            Hello <strong>${fullName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">
            Your partner profile has been created and verified. Below are your account details for reference:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin: 18px 0;">
            <p style="margin: 6px 0; font-size: 13px; color: #334155;">
              <strong>Referral Code:</strong> <span style="font-family: monospace; font-weight: 700; color: #1e293b;">${referralCode}</span>
            </p>
            <p style="margin: 6px 0; font-size: 13px; color: #334155;">
              <strong>Registered ID:</strong> <span style="font-family: monospace; color: #1e293b;">${phone}</span>
            </p>
            <p style="margin: 6px 0; font-size: 13px; color: #334155;">
              <strong>Settlement UPI:</strong> <span style="font-family: monospace; color: #1e293b;">${upiId}</span>
            </p>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #475569; margin: 16px 0 20px 0;">
            You can sign in to view your dashboard, monitor linked stores, and track payouts at:
            <br />
            <a href="https://scantoprint.in/partner/login" style="color: #4338ca; font-weight: 600; text-decoration: underline;">https://scantoprint.in/partner/login</a>
          </p>

          <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0;">
            If you did not request this account registration, please contact our support team.
          </p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <div style="font-size: 11px; color: #94a3b8; text-align: center;">
            ScanToPrint • Support: <a href="mailto:${senderEmail}" style="color: #6366f1; text-decoration: none;">${senderEmail}</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: { name: 'ScanToPrint', email: senderEmail },
        to: [{ email: cleanEmail, name: fullName }],
        replyTo: { email: senderEmail, name: 'ScanToPrint Support' },
        subject: `ScanToPrint Partner Account Details - ${fullName}`,
        textContent: plainText,
        htmlContent: htmlContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errData = await brevoResponse.json();
      throw new Error(errData.message || 'Failed to dispatch welcome email via Brevo');
    }

    return NextResponse.json({ success: true, message: 'Welcome email sent successfully.' });
  } catch (err: any) {
    console.error('Welcome email dispatch error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}