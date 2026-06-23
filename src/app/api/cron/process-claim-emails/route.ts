import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { sendClaimEmail } from '@/lib/email';

// This endpoint should be triggered daily by a cron service
// Make sure to pass an Authorization header or API key if you want to secure it further.
export async function GET(request: Request) {
  // Optional: Add basic security so randos can't trigger your email blasts
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Unauthorized cron attempt");
    // Depending on your setup, you might want to return 401. 
    // For local dev, we'll let it pass if CRON_SECRET isn't set, but you should configure it.
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const adminDbClient = createAdminClient();

  // We are looking for:
  // 1. Unclaimed podcasts (owner_id IS NULL)
  // 2. That have an email (contact_email IS NOT NULL)
  // 3. That have started the sequence (claim_emails_sent > 0)
  // 4. That haven't finished the sequence (claim_emails_sent < 4)
  const { data: podcasts, error: fetchErr } = await adminDbClient
    .from('podcasts')
    .select('id, show_name, contact_email, cover_art_url, claim_emails_sent, last_claim_email_sent_at')
    .is('owner_id', null)
    .not('contact_email', 'is', null)
    .gt('claim_emails_sent', 0)
    .lt('claim_emails_sent', 4);

  if (fetchErr) {
    console.error("Cron fetch error:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const now = new Date();
  let emailsSent = 0;

  for (const podcast of podcasts) {
    if (!podcast.last_claim_email_sent_at) continue;
    
    const lastSentAt = new Date(podcast.last_claim_email_sent_at);
    // Check if 3 days (72 hours) have passed
    const diffTime = Math.abs(now.getTime() - lastSentAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // We want diffDays to be at least 3 (i.e. day 4 since the last email)
    if (diffDays >= 3) {
      try {
        console.log(`Sending drip email ${podcast.claim_emails_sent + 1} to ${podcast.contact_email}`);
        await sendClaimEmail(podcast.contact_email, podcast.show_name, podcast.cover_art_url || '', podcast.id);
        
        await adminDbClient
          .from("podcasts")
          .update({ 
            claim_emails_sent: podcast.claim_emails_sent + 1,
            last_claim_email_sent_at: now.toISOString()
          })
          .eq("id", podcast.id);
          
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send drip email to ${podcast.contact_email}`, err);
      }
    }
  }

  return NextResponse.json({ success: true, processed: emailsSent });
}
