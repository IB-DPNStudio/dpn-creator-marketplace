import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { switchUserCategory } from "@/app/actions/users";

export default async function AgencyApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/agencies/apply");
  }

  async function submitApplication(formData: FormData) {
    "use server";
    
    const result = await switchUserCategory("agency", {
      name: formData.get("name") as string,
      jobTitle: formData.get("jobTitle") as string,
      company: formData.get("company") as string,
      phone: formData.get("phone") as string,
      type: formData.get("type") as string,
      spend: formData.get("spend") as string,
    });

    if (result.success) {
      redirect("/agencies/apply/success");
    } else {
      console.error("Agency application error:", result.error);
    }
  }

  return (
    <div className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Agency Access Request</h1>
          <p className="text-muted-foreground">Apply for access to dentsu's premium podcast marketplace.</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <form action={submitApplication} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="jobTitle" className="text-sm font-medium">Job Title</label>
                <Input id="jobTitle" name="jobTitle" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Company Name *</label>
              <Input id="company" name="company" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
              <Input id="phone" name="phone" type="tel" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Company Type *</label>
                <select id="type" name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Select...</option>
                  <option value="agency">Agency</option>
                  <option value="brand">Direct Brand</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="spend" className="text-sm font-medium">Annual Media Spend</label>
                <select id="spend" name="spend" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Select...</option>
                  <option value="<50L">Under ₹50L</option>
                  <option value="50L-2.5Cr">₹50L - ₹2.5Cr</option>
                  <option value="2.5Cr-10Cr">₹2.5Cr - ₹10Cr</option>
                  <option value="10Cr+">₹10Cr+</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-dentsu hover:bg-dentsu/90 text-white h-12 text-lg mt-8">
              Submit Request
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
