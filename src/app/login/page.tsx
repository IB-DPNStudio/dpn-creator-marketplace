"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your DPN account</p>
        </div>
        
        <div className="space-y-4">
          <Button 
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
          
          <div className="pt-6 border-t border-border/50 text-center space-y-2">
            <p className="text-sm text-muted-foreground">New to DPN?</p>
            <div className="flex justify-center items-center flex-wrap gap-4 text-sm mt-2">
              <button onClick={handleGoogleLogin} className="text-dentsu hover:underline font-bold">
                General User Signup
              </button>
              <span className="text-muted-foreground/30 hidden md:inline">|</span>
              <Link href="/creators/apply" className="text-dentsu hover:underline font-bold">
                Creator Signup
              </Link>
              <span className="text-muted-foreground/30 hidden md:inline">|</span>
              <Link href="/agencies/apply" className="text-dentsu hover:underline font-bold">
                Agency Signup
              </Link>
            </div>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
