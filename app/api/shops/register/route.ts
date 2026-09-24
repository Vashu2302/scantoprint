async function sendWelcomeEmail(shop: {
  ownerName?: string;
  businessName: string;
  email: string;
  planType: string;
  slug: string;
}) {
  const senderEmail = process.env.SUPPORT_EMAIL || 'scantoprint.support@gmail.com';
  const apiKey = process.env.BREVO_API_KEY;

  if (!shop.email || !apiKey) {
    console.warn('Welcome email skipped: Missing email or BREVO_API_KEY');
    return;
  }

  try {
    const planLabel =
      shop.planType === 'premium'
        ? 'Premium Plan'
        : shop.planType === 'standard'
        ? 'Standard Plan'
        : '7-Day Free Trial';

    const recipientName = shop.ownerName || shop.businessName || 'Merchant';

    const plainText = `Hi ${recipientName},\n\nYour ScanToPrint account for "${shop.businessName}" is now active.\n\nAccount Overview:\n- Shop Name: ${shop.businessName}\n- Active Plan: ${planLabel}\n- Counter Login: https://scantoprint.in/login\n\nHow ScanToPrint transforms your print desk:\n- Saves 15-20 minutes every hour: Customer files queue directly to your printer without manual transfers.\n- 100% WhatsApp Clutter Free: Customers scan your unique counter QR code to send documents directly.\n- Direct Payments: All printing charges deposit straight into your linked UPI account.\n- Private & Secure: Customer files auto-delete immediately after printing.\n\nWe are here to help you get started:\nNeed help setting up your desktop spooler or printer settings? Reply directly to this email or ping our support desk. We are always on standby to assist you.\n\nBest regards,\nScanToPrint Support Team\n${senderEmail}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.6; color: #2d3748; margin: 0; padding: 20px;">
        <p style="font-size: 14.5px;">Hi <strong>${recipientName}</strong>,</p>
        
        <p>Your ScanToPrint counter account for <strong>${shop.businessName}</strong> is now live.</p>
        
        <div style="background-color: #f7fafc; border-left: 3px solid #4f46e5; padding: 10px 14px; margin: 16px 0;">
          <strong>Account Summary:</strong><br>
          • Store: ${shop.businessName}<br>
          • Plan: ${planLabel}<br>
          • Merchant Login: <a href="https://scantoprint.in/login" style="color: #4f46e5; text-decoration: underline;">https://scantoprint.in/login</a>
        </div>
        
        <p style="font-weight: 600; margin-top: 18px; margin-bottom: 6px;">How ScanToPrint saves you time every single day:</p>
        <p style="margin: 4px 0;">• <strong>Saves 15-20 mins/hour:</strong> No more waiting for files or manually opening downloads on PC.</p>
        <p style="margin: 4px 0;">• <strong>Zero WhatsApp clutter:</strong> Customers scan your counter QR to send print tasks directly.</p>
        <p style="margin: 4px 0;">• <strong>Direct UPI payments:</strong> Customer payments credit instantly to your own UPI account.</p>
        <p style="margin: 4px 0;">• <strong>Data privacy:</strong> Files auto-purge right after printing is completed.</p>
        
        <div style="background-color: #f0fdf4; border-radius: 6px; padding: 12px; margin: 20px 0; font-size: 13px; color: #166534;">
          <strong>Need setup assistance? We've got your back!</strong><br>
          Whether you need help configuring your desktop spooler agent or connecting your printers, our support team is available anytime. Simply reply to this email or reach us at <a href="mailto:${senderEmail}" style="color: #15803d; text-decoration: underline;">${senderEmail}</a>.
        </div>
        
        <p style="margin-top: 24px; color: #718096; font-size: 12.5px;">
          Warm regards,<br>
          ScanToPrint Support Team<br>
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
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'ScanToPrint Support', email: senderEmail },
        to: [{ email: shop.email, name: recipientName }],
        replyTo: { email: senderEmail, name: 'ScanToPrint Support' },
        subject: `Welcome to ScanToPrint: ${shop.businessName} setup details`,
        textContent: plainText,
        htmlContent: htmlContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errData = await brevoResponse.json();
      console.error('Brevo welcome email dispatch failed:', errData);
    } else {
      console.log('Welcome email successfully dispatched via Brevo to:', shop.email);
    }
  } catch (emailErr) {
    console.error('Welcome email error:', emailErr);
  }
}