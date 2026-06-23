"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface ClaimAuthFormProps {
  token: string;
}

export function ClaimAuthForm({ token }: ClaimAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [mode, setMode] = useState<"signin" | "join">("signin");
  
  const supabase = createClient();
  const nextUrl = `/claim?token=${token}`;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    if (email.toLowerCase().endsWith("@gmail.com")) {
      handleGoogleLogin();
      return;
    }

    setIsEmailLoading(true);
    setRateLimitMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      if (error.status === 429 || error.message?.toLowerCase().includes("rate limit") || error.message?.toLowerCase().includes("limit exceeded")) {
        setRateLimitMessage("We are experiencing high traffic. Please try again after some time.");
      } else {
        let msg = error?.message || error?.error_description || "An error occurred. Please try again.";
        if (typeof msg === 'object' || msg === "{}") {
          msg = "Please enter a valid email address.";
        }
        setRateLimitMessage(msg);
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-background border border-border rounded-xl shadow-xl overflow-hidden relative z-10">
      <div className="flex bg-muted/50 text-sm font-semibold text-muted-foreground cursor-pointer">
        <div 
          onClick={() => setMode("join")} 
          className={`flex-1 py-4 text-center transition-colors ${mode === 'join' ? 'bg-background text-foreground border-b-2 border-foreground' : 'hover:bg-muted/80'}`}
        >
          Join
        </div>
        <div 
          onClick={() => setMode("signin")} 
          className={`flex-1 py-4 text-center transition-colors ${mode === 'signin' ? 'bg-background text-foreground border-b-2 border-foreground' : 'hover:bg-muted/80'}`}
        >
          Sign In
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold font-heading mb-1 text-foreground">
            {mode === 'join' ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="text-xs text-muted-foreground">Continue to claim your podcast dashboard</p>
        </div>
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2 text-left">
            <input
              type="email"
              placeholder="Email Address"
              className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {rateLimitMessage && (
            <div className="text-xs font-medium text-destructive bg-destructive/10 p-3 rounded-md text-left leading-relaxed">
              {rateLimitMessage}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full h-12 bg-dentsu text-white hover:bg-dentsu/90 font-medium"
            disabled={isEmailLoading || emailSent}
          >
            {isEmailLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : emailSent ? (
              "Magic Link Sent!"
            ) : (
              "Continue with Email"
            )}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-background text-muted-foreground">Or</span>
          </div>
        </div>

        <Button 
          type="button"
          variant="outline" 
          className="w-full h-12 relative flex items-center justify-center font-medium" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
