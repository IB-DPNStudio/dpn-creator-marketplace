"use client";

import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSortFabProps {
  onClick: () => void;
  label?: string;
}

export function MobileSortFab({ onClick, label }: MobileSortFabProps) {
  return (
    <div className="fixed bottom-6 right-4 z-50 md:hidden">
      <Button 
        onClick={onClick}
        size="icon"
        className="bg-card text-foreground border border-border/50 shadow-xl rounded-full w-12 h-12 flex items-center justify-center transition-transform active:scale-95 hover:bg-muted"
        aria-label={label || "Sort & Filter"}
      >
        <ListFilter className="w-5 h-5" />
      </Button>
    </div>
  );
}
