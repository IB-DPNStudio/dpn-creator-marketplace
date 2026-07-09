"use client";

import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSortFabProps {
  onClick: () => void;
  label?: string;
}

export function MobileSortFab({ onClick, label = "Sort & Filter" }: MobileSortFabProps) {
  return (
    <div className="fixed bottom-6 right-4 z-50 md:hidden">
      <Button 
        onClick={onClick}
        className="bg-dentsu hover:bg-dentsu/90 text-white rounded-full shadow-2xl h-14 px-6 flex items-center gap-2 font-bold transition-transform active:scale-95"
      >
        <ArrowUpDown className="w-5 h-5" />
        {label}
      </Button>
    </div>
  );
}
