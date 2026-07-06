import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { MobileNavMenu } from "./MobileNavMenu";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;
  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-heading font-bold text-xl tracking-tight flex items-center">
            <img src="/dentsu-logo-new.png" alt="Dentsu" className="h-[18px] w-auto mr-2 dark:invert" />
            <span>Podcast Network</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/creators" className="transition-colors hover:text-foreground/80 text-foreground/60">Creators</Link>
          <Link href="/agencies" className="transition-colors hover:text-foreground/80 text-foreground/60">Agencies</Link>
          <Link href="/rankings" className="transition-colors hover:text-foreground/80 text-foreground/60">Rankings</Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">About</Link>
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
