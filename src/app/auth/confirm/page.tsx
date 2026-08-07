"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

function ConfirmAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as any || "magiclink";
  const next = searchParams.get("next") || "/";

  const handleVerify = async () => {
    setIsLoading(true);
    setError("");
    const supabase = createClient();

    try {
      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });
        if (error) throw error;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else {
        throw new Error("No authentication token found in URL.");
      }

      // Check if user is now logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const is2FARequired = user.email?.toLowerCase().trim() === 'ashwin.gangakhedkar@dentsu.com' || user.user_metadata?.mfa_required === true;
        if (is2FARequired) {
          const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (mfa?.currentLevel !== 'aal2') {
            router.push('/auth/mfa');
            router.refresh();
            return;
          }
        }
        router.push(next);
        router.refresh();
      } else {
        throw new Error("Verification failed. Please try logging in again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during verification. Your link might have expired.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-lg space-y-6 text-center">
        <div className="flex justify-center">
          <ShieldCheck className="w-16 h-16 text-dentsu" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Secure Login Verification</h1>
          <p className="text-muted-foreground text-sm">
            To protect your account from automated email scanners, please click the button below to complete your sign-in.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-500/10 rounded-md text-left leading-tight">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button 
          onClick={handleVerify}
          disabled={isLoading || (!code && !token_hash)}
          className="w-full h-12 text-md font-bold bg-foreground text-background hover:bg-foreground/90"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          {isLoading ? "Verifying..." : "Verify & Log In"}
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmAuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <ConfirmAuthContent />
    </Suspense>
  );
}
