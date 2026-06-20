"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileNavMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center ml-2">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground">
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border p-4 flex flex-col shadow-xl z-50 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2 text-sm font-medium p-2">
            <Link href="/creators" onClick={() => setIsOpen(false)} className="py-3 border-b border-border/30 hover:text-dentsu">Creators</Link>
            <Link href="/agencies" onClick={() => setIsOpen(false)} className="py-3 border-b border-border/30 hover:text-dentsu">Agencies</Link>
            <Link href="/rankings" onClick={() => setIsOpen(false)} className="py-3 border-b border-border/30 hover:text-dentsu">Rankings</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="py-3 border-b border-border/30 hover:text-dentsu">About</Link>
          </div>
          
          <div className="flex flex-col space-y-3 mt-4 pt-4 border-t border-border/50">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                </Button>
                <form action="/auth/signout" method="post" className="w-full">
                  <Button variant="outline" type="submit" className="w-full justify-center border-border hover:bg-muted">
                    Log Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link href="/login" onClick={() => setIsOpen(false)}>Log In</Link>
                </Button>
                <Button asChild className="w-full bg-dentsu hover:bg-dentsu/90 text-white">
                  <Link href="/agencies/apply" onClick={() => setIsOpen(false)}>Request Access</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
