import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-white py-4 md:py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center mb-0 text-white hover:text-gray-200 transition-colors">
              <img src="/dpn-logo-stacked.svg?v=7" alt="dentsu podcast network" className="h-[105px] w-auto" />
            </Link>
            <p className="text-sm text-zinc-400 -mt-2">
              Audience = Revenue. Connect with top podcast creators through dentsu's premium ecosystem.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/creators" className="hover:text-white transition-colors">Creators</Link></li>
              <li><Link href="/agencies" className="hover:text-white transition-colors">Agencies</Link></li>
              <li><Link href="/rankings" className="hover:text-white transition-colors">Rankings</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Get the latest rankings and insights delivered weekly.
            </p>
            <form className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
              />
              <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-dentsu text-white shadow hover:bg-dentsu/90 h-9 px-4 py-2">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} dentsu podcast network. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-zinc-500">
            <span>Powered by dentsu</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
