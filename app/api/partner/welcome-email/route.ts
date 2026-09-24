import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, referralCode, upiId } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing required details.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const senderEmail = process.env.SUPPORT_EMAIL || 'scantoprint.support@gmail.com';

    const plainText = `Hi ${fullName},\n\nYour ScanToPrint partner registration is complete. Here are your account details:\n\nReferral Code: ${referralCode}\nRegistered Phone: ${phone}\nSettlement UPI: ${upiId}\n\nYou can sign in to your dashboard here:\nhttps://scantoprint.in/partner/login\n\nRegards,\nScanToPrint Team\n${senderEmail}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #222222; margin: 0; padding: 16px;">
        <p>Hi ${fullName},</p>
        
        <p>Your ScanToPrint partner registration is complete. Here are your account details:</p>
        
        <p style="margin: 12px 0;">
          Referral Code: <strong>${referralCode}</strong><br>
          Registered Phone: ${phone}<br>
          Settlement UPI: ${upiId}
        </p>
        
        <p>You can sign in to your dashboard here:<br>
          <a href="https://scantoprint.in/partner/login" style="color: #1a73e8;">https://scantoprint.in/partner/login</a>
        </p>
        
        <p style="margin-top: 24px; color: #555555;">
          Regards,<br>
          ScanToPrint Team<br>
          ${senderEmail}
        </p>
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
        subject: `Partner account created: ${fullName}`,
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