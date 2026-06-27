"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, Activity, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileAdminNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Mobile Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-dentsu text-white w-full">
        <span className="font-heading font-bold text-lg tracking-tight">
          DPN Admin
        </span>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 -mr-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bottom-0 bg-background z-50 flex flex-col border-b border-border shadow-xl h-[calc(100vh-4rem)]">
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            <Link onClick={() => setIsOpen(false)} href="/admin" className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary transition-colors">
              <LayoutDashboard className="w-5 h-5 mr-3 text-muted-foreground" />
              Overview
            </Link>
            <Link onClick={() => setIsOpen(false)} href="/admin/approvals" className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary transition-colors">
              <Users className="w-5 h-5 mr-3 text-muted-foreground" />
              Approvals
            </Link>
            <Link onClick={() => setIsOpen(false)} href="/admin/users" className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary transition-colors">
              <Users className="w-5 h-5 mr-3 text-muted-foreground" />
              User Management
            </Link>
            <Link onClick={() => setIsOpen(false)} href="/admin/entities/new" className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary transition-colors">
              <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
              White Glove Onboarding
            </Link>
            <Link onClick={() => setIsOpen(false)} href="/admin/podcasts" className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary transition-colors">
              <Activity className="w-5 h-5 mr-3 text-muted-foreground" />
              Manage Podcasts
            </Link>
          </nav>
          <div className="p-6 border-t border-border mt-auto bg-card">
            <Button variant="ghost" className="w-full justify-start text-destructive" asChild>
              <Link onClick={() => setIsOpen(false)} href="/dashboard">
                <LogOut className="w-5 h-5 mr-3" />
                Exit Admin
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
