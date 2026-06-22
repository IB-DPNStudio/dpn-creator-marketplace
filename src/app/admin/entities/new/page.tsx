"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminCreateCreator, adminCreateAgency, adminSeedPodcast } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminDataEntryPage() {
  const [activeTab, setActiveTab] = useState<'creator' | 'agency' | 'seed'>('creator');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleCreatorSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage(null);
    const data = {
      ownerEmail: formData.get("ownerEmail"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      showName: formData.get("showName"),
      description: formData.get("description"),
      genre: formData.get("genre"),
      language: formData.get("language"),
      youtubeUrl: formData.get("youtubeUrl"),
      spotifyUrl: formData.get("spotifyUrl"),
      instagramUrl: formData.get("instagramUrl"),
      linkedinUrl: formData.get("linkedinUrl"),
      inventoryAvailability: {
        sponsorship: formData.get("sponsorship") === "on",
        host_read: formData.get("hostRead") === "on",
        pre_roll: formData.get("preRoll") === "on",
        mid_roll: formData.get("midRoll") === "on",
        l_band: formData.get("lBand") === "on",
        lower_third: formData.get("lowerThird") === "on",
      }
    };

    const result = await adminCreateCreator(data);
    setIsLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Creator successfully added and invited!' });
      (document.getElementById("creator-form") as HTMLFormElement).reset();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add creator.' });
    }
  };

  const handleAgencySubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage(null);
    const data = {
      ownerEmail: formData.get("ownerEmail"),
      fullName: formData.get("fullName"),
      jobTitle: formData.get("jobTitle"),
      company: formData.get("company"),
      phone: formData.get("phone"),
      type: formData.get("type"),
      spend: formData.get("spend"),
    };

    const result = await adminCreateAgency(data);
    setIsLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Agency successfully added and invited!' });
      (document.getElementById("agency-form") as HTMLFormElement).reset();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add agency.' });
    }
  };

  const handleSeedSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage({ type: 'info', text: 'Fetching YouTube metadata and analyzing channel...' });
    const youtubeUrl = formData.get("youtubeUrl") as string;
    const result = await adminSeedPodcast(youtubeUrl);
    setIsLoading(false);
    if (result.success && result.data) {
      setMessage({ type: 'success', text: `Podcast successfully seeded! Initial DPN Score: ${result.data.dpnScore}, Genre: ${result.data.genre}` });
      (document.getElementById("seed-form") as HTMLFormElement).reset();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to seed podcast.' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-heading">White Glove Onboarding</h1>
        <p className="text-muted-foreground mt-2">Manually create pre-approved records and invite owners.</p>
      </div>

      <div className="flex space-x-4 border-b border-border pb-4">
        <button 
          onClick={() => { setActiveTab('creator'); setMessage(null); }}
          className={`px-4 py-2 font-bold rounded-lg ${activeTab === 'creator' ? 'bg-dentsu text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Add Creator/Podcast
        </button>
        <button 
          onClick={() => { setActiveTab('agency'); setMessage(null); }}
          className={`px-4 py-2 font-bold rounded-lg ${activeTab === 'agency' ? 'bg-dentsu text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Add Agency Partner
        </button>
        <button 
          onClick={() => { setActiveTab('seed'); setMessage(null); }}
          className={`px-4 py-2 font-bold rounded-lg ${activeTab === 'seed' ? 'bg-dentsu text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Seed Podcast (URL Only)
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-medium flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 
          message.type === 'info' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
          'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          {message.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
          {message.text}
        </div>
      )}

      {activeTab === 'creator' && (
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <form id="creator-form" action={handleCreatorSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Account Owner</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Email *</label>
                  <Input name="ownerEmail" type="email" required placeholder="creator@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Full Name</label>
                  <Input name="fullName" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input name="phone" type="tel" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Podcast Details</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Podcast Name *</label>
                <Input name="showName" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brief Description</label>
                <Textarea name="description" rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Genre *</label>
                  <Input name="genre" placeholder="e.g. Business, Comedy" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language *</label>
                  <Input name="language" placeholder="e.g. English, Hindi" required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">YouTube Channel URL *</label>
                  <Input name="youtubeUrl" type="url" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Spotify Podcast URL</label>
                  <Input name="spotifyUrl" type="url" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Inventory Available</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Sponsorship', 'Host Read', 'Pre Roll', 'Mid Roll', 'L Band', 'Lower Third'].map((item) => {
                  const name = item.replace(' ', '').charAt(0).toLowerCase() + item.replace(' ', '').slice(1);
                  return (
                    <div key={item} className="flex items-center space-x-2">
                      <input type="checkbox" name={name} className="rounded border-input text-dentsu focus:ring-dentsu" />
                      <label className="text-sm font-medium">{item}</label>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create and Send Invite
            </Button>
          </form>
        </div>
      )}

      {activeTab === 'agency' && (
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <form id="agency-form" action={handleAgencySubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Account Owner</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Email *</label>
                  <Input name="ownerEmail" type="email" required placeholder="agency@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Full Name *</label>
                  <Input name="fullName" required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Company Details</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name *</label>
                <Input name="company" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input name="jobTitle" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input name="phone" type="tel" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Type *</label>
                  <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select...</option>
                    <option value="agency">Agency</option>
                    <option value="brand">Direct Brand</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Annual Media Spend</label>
                  <select name="spend" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select...</option>
                    <option value="<50L">Under ₹50L</option>
                    <option value="50L-2.5Cr">₹50L - ₹2.5Cr</option>
                    <option value="2.5Cr-10Cr">₹2.5Cr - ₹10Cr</option>
                    <option value="10Cr+">₹10Cr+</option>
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create and Send Invite
            </Button>
          </form>
        </div>
      )}

      {activeTab === 'seed' && (
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <form id="seed-form" action={handleSeedSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading border-b border-border pb-2 text-dentsu">Seed Podcast</h2>
              <p className="text-sm text-muted-foreground">Quickly add a podcast to the directory using only its YouTube channel URL. The system will attempt to fetch basic metadata.</p>
              <div className="space-y-2">
                <label className="text-sm font-medium">YouTube Channel URL *</label>
                <Input name="youtubeUrl" type="url" required placeholder="https://www.youtube.com/@ChannelHandle" />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Seed Podcast
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
