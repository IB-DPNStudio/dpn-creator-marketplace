import { Loader2 } from "lucide-react";

export default function RankingsLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated gradient ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-dentsu via-red-500 to-orange-400 opacity-50 animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-dentsu animate-spin relative z-10" />
        </div>
        
        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Crunching the Numbers...
          </h2>
          <p className="text-muted-foreground text-sm">
            Fetching the latest DPN Power Ranker scores across the network.
          </p>
        </div>
      </div>
    </div>
  );
}
