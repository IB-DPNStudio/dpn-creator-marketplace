"use client";

import { useState } from "react";
import { addOrUpdatePlaylistRank, deleteLabsPlaylist } from "@/app/actions/labs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function LabsClient({ initialPlaylists }: { initialPlaylists: any[] }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    playlistUrlOrId: "",
    title: "",
    description: "",
    language: "English",
    country: "US",
    genre: "General",
    manualBoost: "0",
    manualPenalty: "0",
    notes: ""
  });

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await addOrUpdatePlaylistRank(formData);
      if (!res.success) {
        throw new Error(res.error || "Failed to ingest playlist");
      }
      // Assuming a hard refresh for simplicity on success, or use router.refresh()
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    try {
      await deleteLabsPlaylist(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">🧪 Experimental Playlist Ranker</h1>
        <p className="text-muted-foreground">This is an isolated environment for testing the new playlist-based ranking logic. This does NOT affect the main channel-based ranker.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 border rounded-xl p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Ingest Playlist</h2>
          <form onSubmit={handleIngest} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Playlist URL or ID *</label>
              <Input 
                required 
                value={formData.playlistUrlOrId} 
                onChange={(e) => setFormData({...formData, playlistUrlOrId: e.target.value})} 
                placeholder="https://www.youtube.com/playlist?list=..." 
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Title Override (Optional)</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="Leave blank to use YouTube title" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Genre</label>
                <Input 
                  value={formData.genre} 
                  onChange={(e) => setFormData({...formData, genre: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Language</label>
                <Input 
                  value={formData.language} 
                  onChange={(e) => setFormData({...formData, language: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Manual Boost</label>
                <Input 
                  type="number"
                  value={formData.manualBoost} 
                  onChange={(e) => setFormData({...formData, manualBoost: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Manual Penalty</label>
                <Input 
                  type="number"
                  value={formData.manualPenalty} 
                  onChange={(e) => setFormData({...formData, manualPenalty: e.target.value})} 
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Internal Notes</label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Processing..." : "Ingest & Score"}
            </Button>
          </form>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Ranked Playlists</h2>
          
          <div className="flex flex-col gap-4">
            {playlists.length === 0 && (
              <div className="text-muted-foreground border border-dashed rounded p-8 text-center">
                No playlists ingested yet. Add one to see the ranking logic in action.
              </div>
            )}
            
            {playlists.map((p, idx) => (
              <div key={p.id} className="border rounded-xl p-5 bg-card flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      {p.show_name}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {p.genre} • {p.total_episodes} Episodes • Last active: {p.latest_episode_date ? new Date(p.latest_episode_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-3xl font-black text-primary">{p.final_score}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Final Score</div>
                    <button onClick={() => handleDelete(p.playlist_id)} className="text-red-500 text-xs hover:underline mt-2">Delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 border-t pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Engagement</span>
                    <span className="font-semibold">{p.score_breakdown?.engagement || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Freshness</span>
                    <span className="font-semibold">{p.score_breakdown?.freshness || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Depth</span>
                    <span className="font-semibold">{p.score_breakdown?.depth || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Consistency</span>
                    <span className="font-semibold">{p.score_breakdown?.consistency || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Confidence</span>
                    <span className="font-semibold">{p.score_breakdown?.confidence || 0}</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded p-3 text-sm flex flex-col gap-2">
                  {p.explanations?.positive?.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✅</span>
                      <span>{p.explanations.positive.join(" ")}</span>
                    </div>
                  )}
                  {p.explanations?.negative?.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">⚠️</span>
                      <span>{p.explanations.negative.join(" ")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
