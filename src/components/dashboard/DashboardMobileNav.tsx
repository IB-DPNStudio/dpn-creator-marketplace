"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, FileText, Settings, LogOut, User } from 'lucide-react';

export function DashboardMobileNav({ 
  isAdmin, 
  isAgency 
}: { 
  isAdmin: boolean; 
  isAgency: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground">
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border p-4 flex flex-col shadow-xl z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2">
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-foreground hover:bg-secondary transition-colors border-b border-border/30">
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Catalogue
            </Link>
            
            {(isAgency || isAdmin) && (
              <Link href="/dashboard/eois" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-foreground hover:bg-secondary transition-colors border-b border-border/30">
                <FileText className="w-5 h-5 mr-3" />
                Campaigns (EOIs)
              </Link>
            )}

            <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-foreground hover:bg-secondary transition-colors border-b border-border/30">
              <User className="w-5 h-5 mr-3" />
              My Profile
            </Link>

            {isAdmin && (
              <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-foreground hover:bg-secondary transition-colors border-b border-border/30">
                <Settings className="w-5 h-5 mr-3" />
                DPN Admin
              </Link>
            )}
          </nav>
          
          <div className="mt-4 pt-4 border-t border-border">
            <form action="/auth/signout" method="post">
              <button className="flex w-full items-center px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
