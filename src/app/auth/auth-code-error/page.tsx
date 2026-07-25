'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorDescription = searchParams.get('error_description') || 'The authentication link is invalid or has expired.';
  const errorCode = searchParams.get('error_code');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-600">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-foreground">Authentication Link Error</h1>
          <p className="text-sm text-muted-foreground">
            {errorDescription}
          </p>
        </div>

        {errorCode === 'otp_expired' && (
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 text-xs text-yellow-600 text-left space-y-2 leading-relaxed">
            <span className="font-bold">Why did this happen?</span>
            <p>
              Corporate email security systems (like Dentsu's firewalls) automatically pre-scan and load links in incoming emails to check for safety. 
              Because Supabase invitation links are strictly **single-use**, the security scanner may have accidentally consumed the token before you clicked it.
            </p>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 bg-dentsu hover:bg-dentsu/90 text-white">
            <Link href="/login">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try logging in again
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          If you continue to face issues, please ask your administrator to copy and share the direct registration link with you.
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
