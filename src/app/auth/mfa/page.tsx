"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, AlertCircle, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function MFAPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [factorId, setFactorId] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [isEnrollment, setIsEnrollment] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function initMFA() {
      setIsLoading(true);
      setError("");
      const supabase = createClient();
      
      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;

        // If user already passed 2FA for this session
        if (aalData?.currentLevel === "aal2") {
          router.push("/admin");
          return;
        }

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const verifiedFactor = factorsData?.totp?.find((f) => f.status === "verified");

        if (verifiedFactor) {
          // ALREADY ENROLLED -> CHALLENGE MODE
          setFactorId(verifiedFactor.id);
          setIsEnrollment(false);
        } else {
          // Clean up any stale unverified TOTP factors first to avoid limits
          const unverifiedFactors = factorsData?.totp?.filter((f: any) => f.status === "unverified") || [];
          for (const f of unverifiedFactors) {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }

          // NOT ENROLLED -> ENROLLMENT MODE
          setIsEnrollment(true);
          const enroll = await supabase.auth.mfa.enroll({ factorType: "totp" });
          if (enroll.error) throw enroll.error;
          
          setFactorId(enroll.data.id);
          setTotpUri(enroll.data.totp.uri || enroll.data.totp.secret);
          setTotpSecret(enroll.data.totp.secret);
        }
      } catch (err: any) {
        console.error("MFA INIT ERROR:", err);
        setError(err.message || "Failed to initialize 2FA. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    }
    
    initMFA();
  }, [router]);

  const copySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || !factorId) return;
    
    setIsSubmitting(true);
    setError("");
    const supabase = createClient();
    
    try {
      const verifyRes = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      
      if (verifyRes.error) throw verifyRes.error;
      
      // Successfully authenticated at AAL2!
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("MFA VERIFY ERROR:", err);
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
              ? "Scan the QR code or copy the key below into Microsoft Authenticator or Google Authenticator." 
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
            {isEnrollment && (
              <div className="space-y-4">
                {totpUri && (
                  <div className="flex justify-center p-4 bg-white rounded-lg inline-block mx-auto border border-border">
                    <QRCodeSVG value={totpUri} size={180} />
                  </div>
                )}
                {totpSecret && (
                  <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                    <p className="text-muted-foreground">Can't scan? Enter key manually in Authenticator app:</p>
                    <div className="flex items-center justify-center gap-2 font-mono font-bold text-sm select-all">
                      <span>{totpSecret}</span>
                      <button
                        type="button"
                        onClick={copySecret}
                        className="inline-flex items-center text-dentsu hover:underline text-xs font-sans font-bold"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
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
                autoFocus
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
