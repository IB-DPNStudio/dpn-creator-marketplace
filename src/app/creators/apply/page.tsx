import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { switchUserCategory } from "@/app/actions/users";
import { PODCAST_GENRES } from "@/lib/constants";

export default async function CreatorApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ claim_token?: string }>;
}) {
  const params = await searchParams;
  const claimToken = params.claim_token;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/creators/apply${claimToken ? `?claim_token=${claimToken}` : ''}`);
  }

  async function submitApplication(formData: FormData) {
    "use server";
    
    const result = await switchUserCategory("creator", {
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      showName: formData.get("showName") as string,
      description: formData.get("description") as string,
      genre: formData.get("genre") as string,
      language: formData.get("language") as string,
      youtubeUrl: formData.get("youtubeUrl") as string,
      spotifyUrl: formData.get("spotifyUrl") as string,
      instagramUrl: formData.get("instagramUrl") as string,
      linkedinUrl: formData.get("linkedinUrl") as string,
      inventoryAvailability: {
        sponsorship: formData.get("sponsorship") === "on",
        host_read: formData.get("hostRead") === "on",
        pre_roll: formData.get("preRoll") === "on",
        mid_roll: formData.get("midRoll") === "on",
        l_band: formData.get("lBand") === "on",
        lower_third: formData.get("lowerThird") === "on",
      }
    }, claimToken);

    if (result.success) {
      if (claimToken) {
        redirect("/dashboard");
      } else {
        redirect("/creators/apply/success");
      }
    } else {
      console.error("Creator application error:", result.error);
    }
  }

  return (
    <div className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-10">
          <h1 className="font-heading text-4xl font-bold mb-2">Creator Application</h1>
          <p className="text-muted-foreground">Submit your podcast details to join the Dentsu Podcast Network.</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <form action={submitApplication} className="space-y-8">
            
            {/* Personal Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2">Creator Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
              </div>
            </div>

            {/* Show Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2">Show Information</h2>
              {!claimToken && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="showName" className="text-sm font-medium">Podcast Name *</label>
                    <Input id="showName" name="showName" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Brief Description</label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!claimToken && (
                  <div className="space-y-2">
                    <label htmlFor="genre" className="text-sm font-medium">Primary Genre *</label>
                    <select id="genre" name="genre" required={!claimToken} defaultValue="" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="" disabled>Select a genre...</option>
                      {PODCAST_GENRES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">Language {!claimToken && "*"}</label>
                  <Input id="language" name="language" placeholder="e.g. English, Hindi" required={!claimToken} />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2">Links & Socials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!claimToken && (
                  <div className="space-y-2">
                    <label htmlFor="youtubeUrl" className="text-sm font-medium">YouTube Channel URL *</label>
                    <Input id="youtubeUrl" name="youtubeUrl" type="url" placeholder="https://youtube.com/..." required />
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="spotifyUrl" className="text-sm font-medium">Spotify Podcast URL</label>
                  <Input id="spotifyUrl" name="spotifyUrl" type="url" placeholder="https://open.spotify.com/..." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="instagramUrl" className="text-sm font-medium">Instagram Profile (Optional)</label>
                  <Input id="instagramUrl" name="instagramUrl" type="url" placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="linkedinUrl" className="text-sm font-medium">LinkedIn Profile (Optional)</label>
                  <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2">Available Inventory</h2>
              <p className="text-sm text-muted-foreground mb-4">Select the types of ad formats you are willing to support.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Sponsorship', 'Host Read', 'Pre Roll', 'Mid Roll', 'L Band', 'Lower Third'].map((item) => {
                  const id = item.replace(' ', '');
                  const name = item.replace(' ', '').charAt(0).toLowerCase() + item.replace(' ', '').slice(1);
                  return (
                    <div key={item} className="flex items-center space-x-2">
                      <input type="checkbox" id={id} name={name} className="rounded border-input text-dentsu focus:ring-dentsu" />
                      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {item}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12 text-lg">
              Submit Application
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
