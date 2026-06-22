"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeletePodcastButtonProps {
  onDelete: () => void;
}

export function DeletePodcastButton({ onDelete }: DeletePodcastButtonProps) {
  return (
    <form action={() => {
      if (window.confirm("Are you sure you want to delete this podcast from everywhere - ranker, catalogue etc.?")) {
        onDelete();
      }
    }}>
      <Button 
        type="submit" 
        variant="destructive"
        size="sm"
        title="Delete Podcast"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </form>
  );
}
