"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Shield, User, Mic2, Briefcase, CheckCircle } from "lucide-react";
import { switchUserCategory } from "@/app/actions/users";

type UserRole = "creator" | "agency_user" | "creator_manager" | "dpn_sales" | "super_admin";

export function CategorySwitcher({
  currentRole,
  userEmail,
  currentProfile,
}: {
  currentRole: UserRole;
  userEmail: string;
  currentProfile: any;
}) {
  // Map internal roles to readable names
  const roleMap: Record<UserRole | "general_user", string> = {
    creator_manager: "General User",
    general_user: "General User",
    creator: "Creator",
    agency_user: "Agency",
    dpn_sales: "DPN Sales (Admin)",
    super_admin: "Super Admin",
  };

  const getCategoryFromRole = (role: UserRole | "general_user"): "general" | "creator" | "agency" | "admin" => {
    if (role === "creator") return "creator";
    if (role === "agency_user") return "agency";
    if (role === "creator_manager" || role === "general_user") return "general";
    return "admin";
  };

  const initialCategory = getCategoryFromRole(currentRole);
  const [selectedCategory, setSelectedCategory] = useState<"general" | "creator" | "agency">(
    initialCategory === "admin" ? "general" : initialCategory
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Switch to General User
  const handleSwitchToGeneral = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await switchUserCategory("general");
      if (res.success) {
        setSuccessMsg("Successfully switched to General User! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Failed to switch category.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Creator Form
  const handleCreatorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    const data = {
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
      },
    };

    try {
      const res = await switchUserCategory("creator", data);
      if (res.success) {
        setSuccessMsg("Successfully registered as a Creator! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Failed to submit Creator registration.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Agency Form
  const handleAgencySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      jobTitle: formData.get("jobTitle") as string,
      company: formData.get("company") as string,
      phone: formData.get("phone") as string,
      type: formData.get("type") as string,
      spend: formData.get("spend") as string,
    };

    try {
      const res = await switchUserCategory("agency", data);
      if (res.success) {
        setSuccessMsg("Successfully registered as an Agency! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Failed to submit Agency registration.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Current Category Info */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-dentsu/10 flex items-center justify-center text-dentsu flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-snug">Current Account Category</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Email: {userEmail}</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-dentsu text-white font-bold text-sm rounded-xl uppercase tracking-wider">
          {roleMap[currentRole] || "Unknown"}
        </div>
      </div>

      {/* Select Category Tabs */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg font-heading">Switch Account Category</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "general", label: "General User", icon: User, desc: "Browse Network listings & DPN Rankings data" },
            { id: "creator", label: "Creator", icon: Mic2, desc: "List and manage your podcast catalog" },
            { id: "agency", label: "Agency / Advertiser", icon: Briefcase, desc: "Submit Expressions of Interest & campaign briefs" },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const isCurrent = initialCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id as any);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-40 transition-all duration-300 ${
                  isSelected
                    ? "border-dentsu bg-dentsu/5 shadow-md scale-[1.02]"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className={`p-2.5 rounded-xl ${isSelected ? "bg-dentsu text-white" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-base">{cat.label}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success/Error Alerts */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-xl font-semibold">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-6 py-4 rounded-xl font-semibold flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 animate-bounce" />
          {successMsg}
        </div>
      )}

      {/* Switcher Form Area */}
      {selectedCategory === initialCategory ? (
        <div className="p-8 text-center bg-muted/40 border border-border border-dashed rounded-2xl text-muted-foreground">
          You are currently in the <strong className="text-foreground">{roleMap[currentRole]}</strong> category. Select another option above to change categories.
        </div>
      ) : (
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm space-y-6">
          {selectedCategory === "general" && (
            <div className="space-y-4">
              <h3 className="font-bold text-xl font-heading text-red-500">Confirm Switch to General User</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By switching to a <strong>General User</strong>, you will no longer be listed as a Creator or Agency owner.
                Any active podcasts or campaign briefs (EOIs) associated with this account will be automatically deleted to maintain single-category integrity.
              </p>
              <Button
                onClick={handleSwitchToGeneral}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Confirm Switch to General User
              </Button>
            </div>
          )}

          {selectedCategory === "creator" && (
            <form onSubmit={handleCreatorSubmit} className="space-y-6">
              <h3 className="font-bold text-xl font-heading border-b border-border pb-2">Creator Details Form</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input name="fullName" defaultValue={currentProfile?.full_name || ""} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input name="phone" type="tel" defaultValue={currentProfile?.phone || ""} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="font-bold text-lg font-heading">Show Information</h4>
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
                    <Input name="genre" placeholder="e.g. Business, Tech, Comedy" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language *</label>
                    <Input name="language" placeholder="e.g. English, Hindi" required />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="font-bold text-lg font-heading">Links & Socials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube Channel URL *</label>
                    <Input name="youtubeUrl" type="url" placeholder="https://youtube.com/..." required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Spotify Podcast URL</label>
                    <Input name="spotifyUrl" type="url" placeholder="https://open.spotify.com/..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instagram Profile URL</label>
                    <Input name="instagramUrl" type="url" placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">LinkedIn Profile URL</label>
                    <Input name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="font-bold text-lg font-heading">Available Inventory</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {["Sponsorship", "Host Read", "Pre Roll", "Mid Roll", "L Band", "Lower Third"].map((item) => {
                    const id = item.replace(" ", "");
                    const name = id.charAt(0).toLowerCase() + id.slice(1);
                    return (
                      <div key={item} className="flex items-center space-x-2">
                        <input type="checkbox" id={id} name={name} className="rounded border-input text-dentsu focus:ring-dentsu" />
                        <label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">
                          {item}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12 text-lg font-bold"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Register & Switch to Creator
              </Button>
            </form>
          )}

          {selectedCategory === "agency" && (
            <form onSubmit={handleAgencySubmit} className="space-y-6">
              <h3 className="font-bold text-xl font-heading border-b border-border pb-2">Agency Details Form</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input name="name" defaultValue={currentProfile?.full_name || ""} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input name="jobTitle" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name *</label>
                <Input name="company" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input name="phone" type="tel" defaultValue={currentProfile?.phone || ""} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Type *</label>
                  <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select...</option>
                    <option value="agency">Agency</option>
                    <option value="brand">Direct Brand</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Annual Media Spend</label>
                  <select name="spend" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select...</option>
                    <option value="<50L">Under ₹50L</option>
                    <option value="50L-2.5Cr">₹50L - ₹2.5Cr</option>
                    <option value="2.5Cr-10Cr">₹2.5Cr - ₹10Cr</option>
                    <option value="10Cr+">₹10Cr+</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12 text-lg font-bold"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Register & Switch to Agency
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
