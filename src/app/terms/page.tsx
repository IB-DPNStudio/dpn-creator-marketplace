import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-sm prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="font-heading text-4xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 2026</p>
          
          <h2>1. Terms</h2>
          <p>By accessing the Dentsu Podcast Network (DPN) Platform, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
          
          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on DPN's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on DPN's website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>

          <h2>3. Disclaimer</h2>
          <p>The materials on DPN's website are provided on an 'as is' basis. DPN makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

          <h2>4. Limitations</h2>
          <p>In no event shall DPN or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on DPN's website, even if DPN or a DPN authorized representative has been notified orally or in writing of the possibility of such damage.</p>

          <h2>5. Revisions and Errata</h2>
          <p>The materials appearing on DPN's website could include technical, typographical, or photographic errors. DPN does not warrant that any of the materials on its website are accurate, complete or current. DPN may make changes to the materials contained on its website at any time without notice.</p>
        </div>
      </div>
    </div>
  );
}
