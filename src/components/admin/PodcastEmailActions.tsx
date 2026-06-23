"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Edit2, Loader2, Check } from "lucide-react";
import { updatePodcastEmail, adminSendClaimEmail } from "@/app/actions/admin";

export function PodcastEmailActions({ 
  podcastId, 
  currentEmail, 
  isClaimed,
  emailsSentCount = 0
}: { 
  podcastId: string; 
  currentEmail: string | null; 
  isClaimed: boolean;
  emailsSentCount?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [emailValue, setEmailValue] = useState(currentEmail || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSaveEmail = async () => {
    setIsLoading(true);
    await updatePodcastEmail(podcastId, emailValue);
    setIsLoading(false);
    setIsEditing(false);
  };

  const handleSendEmail = async () => {
    if (!currentEmail) return alert("Please set an email first.");
    setIsSending(true);
    await adminSendClaimEmail(podcastId);
    setIsSending(false);
  };

  if (isClaimed) {
    return <span className="text-xs text-green-600 font-medium">Claimed by Owner</span>;
  }

  return (
    <div className="flex flex-col gap-2 min-w-[180px]">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input 
            value={emailValue} 
            onChange={e => setEmailValue(e.target.value)} 
            placeholder="Email..."
            className="h-8 text-xs"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSaveEmail} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs truncate max-w-[140px]" title={currentEmail || 'No email'}>
            {currentEmail || 'No email'}
          </span>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {currentEmail && !isEditing && (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs w-full justify-start" 
            onClick={handleSendEmail}
            disabled={isSending || emailsSentCount >= 4}
          >
            {isSending ? <Loader2 className="w-3 h-3 animate-spin mr-1 shrink-0" /> : <Mail className="w-3 h-3 mr-1 shrink-0" />}
            {emailsSentCount === 0 ? "Send Claim Email" : `Resend (${emailsSentCount}/4)`}
          </Button>
        </div>
      )}
    </div>
  );
}
