import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { MobileNavMenu } from "./MobileNavMenu";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50 w-full text-white">
      <div className="container mx-auto flex h-[90px] items-center px-4 justify-between">
        <Link href="/" className="flex items-center">
          <div className="flex items-center text-white hover:text-gray-200 transition-colors">
            <img src="/dpn-logo-stacked.svg?v=9" alt="dentsu podcast network" className="h-[65px] w-auto" />
          </div>
        </Link>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/creators" className="transition-colors hover:text-white/80 text-white">Creators</Link>
          <Link href="/agencies" className="transition-colors hover:text-white/80 text-white">Agencies</Link>
          <Link href="/rankings" className="transition-colors hover:text-white/80 text-white">Rankings</Link>
          <Link href="/about" className="transition-colors hover:text-white/80 text-white">About</Link>
        </div>
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action="/auth/signout" method="post">
                <Button variant="outline" type="submit" className="hidden md:inline-flex border-border hover:bg-muted">
                  Log Out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex bg-dentsu hover:bg-dentsu/90 text-white">
                <Link href="/agencies/apply">Request Access</Link>
              </Button>
            </>
          )}
          <MobileNavMenu isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </nav>
  );
}
