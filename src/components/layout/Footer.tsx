import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <img src="/dentsu-logo.png" alt="Dentsu Podcast Network" className="h-20 w-auto dark:invert" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Audience = Revenue. Connect with top podcast creators through Dentsu's premium ecosystem.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/creators" className="hover:text-foreground transition-colors">Creators</Link></li>
              <li><Link href="/agencies" className="hover:text-foreground transition-colors">Agencies</Link></li>
              <li><Link href="/rankings" className="hover:text-foreground transition-colors">Rankings</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest rankings and insights delivered weekly.
            </p>
            <form className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Dentsu Podcast Network. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>Powered by Dentsu</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
