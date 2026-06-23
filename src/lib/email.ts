import nodemailer from 'nodemailer';

// Create the transporter using Brevo SMTP details provided
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'afbdb4001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_PASSWORD || '', // User will need to add this to .env.local
  },
});

export async function sendClaimEmail(toEmail: string, showName: string, coverUrl: string, claimToken: string) {
  const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/claim?token=${claimToken}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <p>Hello <strong>${showName}</strong></p>
      <br/>
      <p>Congratulations your podcast has been successfully added to the DPN Index.</p>
      <br/>
      <p>Please click <a href="${claimUrl}" style="color: #0066cc;">here</a> to claim it.</p>
      <br/>
      ${coverUrl ? `<img src="${coverUrl}" alt="${showName} Cover" style="max-width: 100%; border-radius: 8px; margin: 20px 0;" />` : ''}
      <br/>
      <p>Once claimed you can access your creators dashboard to see who is a fan of your podcast, how long they listened to your podcast and if they paid you any micropayments.</p>
      <br/>
      <p>Thanks in advance</p>
      <p><strong>DPN Team</strong></p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"DPN Team" <studio@ideabrews.com>', 
    to: toEmail,
    subject: `Congratulations your podcast was successful`,
    html: htmlContent,
  });

  return info;
}
