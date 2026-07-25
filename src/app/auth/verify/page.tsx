'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ShieldCheck, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'invite';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (!tokenHash) {
      setError("Verification token is missing. Please contact your administrator.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (verifyErr) {
        setError(verifyErr.message);
      } else {
        setSuccess(true);
        // Small delay before redirecting to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-dentsu/10 rounded-full flex items-center justify-center text-dentsu">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-foreground">Activate Your DPN Account</h1>
          <p className="text-sm text-muted-foreground">
            You have been invited to join the <strong>dentsu podcast network</strong>. Click the button below to confirm your invitation and log in.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verified successfully! Redirecting...</span>
          </div>
        ) : (
          <Button
            onClick={handleVerify}
            disabled={isLoading || !tokenHash}
            className="w-full bg-dentsu hover:bg-dentsu/90 text-white py-6 text-base font-bold rounded-xl transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Join Network
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        )}

        <div className="text-xs text-muted-foreground pt-4 border-t border-border">
          This intermediate step prevents email security filters from accidentally expiring your invitation.
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
