import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AgencySuccessPage() {
  return (
    <div className="py-32 bg-background min-h-[80vh] flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-spotify mx-auto" />
        <h1 className="font-heading text-3xl font-bold">Request Received</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Thank you for applying to access the dentsu podcast network. Our team will review your credentials and grant access to the private marketplace once approved.
        </p>
        <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-dentsu hover:bg-dentsu/90 text-white mt-8 h-10 px-4 py-2 font-medium transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
