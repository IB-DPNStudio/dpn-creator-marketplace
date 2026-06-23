import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { ClaimAuthForm } from "./ClaimAuthForm";

export default async function ClaimPodcastPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  
  if (!token) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { createAdminClient } = await import("@/utils/supabase/server");
  const adminClient = createAdminClient();

  // Fetch the podcast immediately, regardless of auth status
  const { data: podcast, error: pErr } = await adminClient
    .from("podcasts")
    .select("id, show_name, description, thumbnail_url, cover_art_url, subscriber_count, owner_id")
    .eq("id", token)
    .single();

  if (pErr || !podcast) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Podcast Not Found</h1>
          <p className="text-muted-foreground mb-6">The claim link you followed is invalid or has expired.</p>
          <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  if (podcast.owner_id) {
    if (user && podcast.owner_id === user.id) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md border border-border">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Already Claimed!</h1>
            <p className="text-muted-foreground mb-6">You have already claimed <strong>{podcast.show_name}</strong>.</p>
            <Button asChild className="bg-dentsu text-white hover:bg-dentsu/90 w-full h-12"><Link href="/dashboard">Go to Dashboard</Link></Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md border border-border">
            <h1 className="text-2xl font-bold mb-4">Already Claimed</h1>
            <p className="text-muted-foreground mb-6">This podcast has already been claimed by another user.</p>
            <Button asChild className="w-full"><Link href="/">Go Home</Link></Button>
          </div>
        </div>
      );
    }
  }

  // If unowned but user is logged in
  if (user) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'creator') {
      // Redirect to formal onboarding to capture inventory info
      redirect(`/creators/apply?claim_token=${podcast.id}`);
    } else {
      // They are already a creator, just claim it
      const { error: claimErr } = await adminClient
        .from("podcasts")
        .update({ owner_id: user.id })
        .eq("id", podcast.id);

      if (claimErr) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-red-500">Error Claiming Podcast</h1>
              <p className="text-muted-foreground mb-6">There was an error claiming your podcast. Please try again or contact support.</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          <div className="bg-card p-10 rounded-2xl shadow-sm text-center max-w-lg border border-border">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold font-heading mb-4 text-dentsu">Podcast Claimed!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Congratulations! You are now the official owner of <strong>{podcast.show_name}</strong> on the DPN Platform.
            </p>
            <Button asChild className="w-full h-12 text-lg bg-dentsu text-white hover:bg-dentsu/90">
              <Link href="/dashboard">Access Creator Dashboard</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  // Not logged in - Show Immersive Landing Page
  const coverImage = podcast.thumbnail_url || podcast.cover_art_url || '/placeholder.png';

  return (
    <div className="min-h-[90vh] relative flex items-center justify-center p-4 overflow-hidden">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url('${coverImage}')`, filter: 'blur(30px) brightness(0.6)', transform: 'scale(1.1)' }}
      />
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      <div className="relative z-10 container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Side: Podcast Info */}
        <div className="text-white space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          <img 
            src={coverImage} 
            alt={podcast.show_name} 
            className="w-56 h-56 md:w-80 md:h-80 object-cover rounded-2xl shadow-2xl ring-4 ring-white/10" 
          />
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-tight">
              {podcast.show_name}
            </h1>
            <p className="text-lg text-white/80 line-clamp-4 max-w-xl">
              {podcast.description || "Welcome to the official Creator Dashboard claim page for your podcast."}
            </p>
            <div className="flex items-center justify-center lg:justify-start space-x-3 text-white/90 bg-black/20 w-fit px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="font-bold text-xl">{podcast.subscriber_count?.toLocaleString() || "0"}</span>
              <span className="text-sm uppercase tracking-wider font-semibold text-white/70">Subscribers</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex justify-center lg:justify-center w-full">
          <ClaimAuthForm token={token} />
        </div>
      </div>
    </div>
  );
}
