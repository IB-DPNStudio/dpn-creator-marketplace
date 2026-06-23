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
  const logoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dpnranker.com'}/dentsu-logo.png`;
  const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dpnranker.com'}/claim?token=${claimToken}`;
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <!-- Header Area -->
      <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #eaeaef;">
        <img src="${logoUrl}" alt="Dentsu Podcast Network" style="max-height: 80px; width: auto;" />
      </div>

      <!-- Main Content Area -->
      <div style="padding: 40px 30px;">
        <h2 style="margin-top: 0; color: #000000; font-size: 22px;">You've been featured, ${showName}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
          Congratulations! <strong>${showName}</strong> has been officially indexed and featured on the <strong>DPN Ranker</strong> — the premier platform connecting top podcast creators with global brands.
        </p>

        <!-- Cover Art -->
        ${coverUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <img src="${coverUrl}" alt="${showName} Cover Art" style="max-width: 250px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />
          </div>
        ` : ''}

        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
          By claiming your podcast, you will unlock your exclusive <strong>Creator Dashboard</strong>. This opens the door to lucrative sponsorship opportunities to work and earn with major brands and agencies within the Dentsu network.
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${claimUrl}" style="background-color: #e60000; color: #ffffff; padding: 16px 32px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; display: inline-block;">
            Claim Your Podcast Now
          </a>
        </div>
        
        <p style="font-size: 14px; line-height: 1.5; color: #888888; text-align: center;">
          Ready to take your podcast to the next level? Join the DPN network today and let agencies come to you.
        </p>
      </div>

      <!-- Footer Area -->
      <div style="background-color: #f8f8fa; padding: 20px; text-align: center; border-top: 1px solid #eaeaef;">
        <p style="margin: 0; font-size: 12px; color: #888888;">
          © ${new Date().getFullYear()} Dentsu Podcast Network. All rights reserved.<br/>
          Empowering creators globally.
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"DPN Team" <studio@ideabrews.com>', 
    to: toEmail,
    subject: `You've been featured on DPN Ranker: Claim ${showName} Now!`,
    html: htmlContent,
  });

  return info;
}
