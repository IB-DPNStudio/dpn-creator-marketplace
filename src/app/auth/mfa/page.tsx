"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function MFAPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [isEnrollment, setIsEnrollment] = useState(false);

  useEffect(() => {
    async function initMFA() {
      setIsLoading(true);
      const supabase = createClient();
      
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;

        // If already at aal2, redirect to admin
        if (data?.currentLevel === "aal2") {
          router.push("/admin");
          return;
        }

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totpFactor = factorsData?.totp[0];

        if (totpFactor && totpFactor.status === "verified") {
          // ALREADY ENROLLED -> CHALLENGE MODE
          setFactorId(totpFactor.id);
          setIsEnrollment(false);
          const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
          if (challenge.error) throw challenge.error;
          setChallengeId(challenge.data.id);
        } else {
          // NOT ENROLLED -> ENROLLMENT MODE
          setIsEnrollment(true);
          const enroll = await supabase.auth.mfa.enroll({ factorType: "totp" });
          if (enroll.error) throw enroll.error;
          
          setFactorId(enroll.data.id);
          setQrCodeData(enroll.data.totp.qr_code);

          const challenge = await supabase.auth.mfa.challenge({ factorId: enroll.data.id });
          if (challenge.error) throw challenge.error;
          setChallengeId(challenge.data.id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize MFA. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
    
    initMFA();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    setIsSubmitting(true);
    setError("");
    const supabase = createClient();
    
    try {
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });
      
      if (verify.error) throw verify.error;
      
      // Successfully authenticated at AAL2!
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid authentication code. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-lg space-y-6 text-center">
        <div className="flex justify-center">
          <ShieldCheck className="w-16 h-16 text-dentsu" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-sm">
            {isEnrollment 
              ? "Since this is your first time, please scan this QR code using Microsoft Authenticator or Google Authenticator." 
              : "Please enter the 6-digit code from your Authenticator app."}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-500/10 rounded-md text-left leading-tight">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isEnrollment && qrCodeData && (
              <div className="flex justify-center p-4 bg-white rounded-lg inline-block mx-auto">
                <QRCodeSVG value={qrCodeData} size={200} />
              </div>
            )}
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] h-14"
                maxLength={6}
                required
              />
              <Button 
                type="submit"
                disabled={isSubmitting || code.length < 6}
                className="w-full h-12 text-md font-bold bg-foreground text-background hover:bg-foreground/90"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isSubmitting ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
