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
  
  const [languageFilter, setLanguageFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");

  const uniqueLanguages = Array.from(new Set(initialPlaylists.map(p => p.primary_language || 'Unknown'))).filter(Boolean);
  const uniqueGenres = Array.from(new Set(initialPlaylists.map(p => p.genre || 'General'))).filter(Boolean);

  const filteredPlaylists = playlists.filter(p => {
    if (languageFilter !== "All" && (p.primary_language || 'Unknown') !== languageFilter) return false;
    if (genreFilter !== "All" && (p.genre || 'General') !== genreFilter) return false;
    return true;
  });

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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ranked Playlists</h2>
            <div className="flex gap-2">
              <select className="border text-sm p-2 rounded-md" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
                <option value="All">All Languages</option>
                {uniqueLanguages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select className="border text-sm p-2 rounded-md" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
                <option value="All">All Genres</option>
                {uniqueGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {filteredPlaylists.length === 0 && (
              <div className="text-muted-foreground border border-dashed rounded p-8 text-center">
                No playlists match the filters. Add one to see the ranking logic in action.
              </div>
            )}
            
            {filteredPlaylists.map((p, idx) => (
              <PlaylistCard key={p.id} idx={idx} p={p} handleDelete={handleDelete} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { fetchPlaylistSampleVideos } from "@/app/actions/labs";

function PlaylistCard({ idx, p, handleDelete }: { idx: number, p: any, handleDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  const decodeHTML = (html: string) => {
    if (!html) return '';
    return html.replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>');
  };

  const toggleExpand = async () => {
    if (!expanded && !hasFetched) {
      setLoading(true);
      const res = await fetchPlaylistSampleVideos(p.playlist_id);
      if (res.success) {
        setVideos(res.videos);
        setHasFetched(true);
      }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="border rounded-xl p-5 bg-card flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-4 items-center">
          {p.thumbnail_url ? (
            <img src={p.thumbnail_url} alt="thumbnail" className="w-16 h-16 object-cover rounded-lg shrink-0" />
          ) : (
            <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow">
              {(Array.from(decodeHTML(p.show_name).trim())[0] || '?').toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full inline-flex items-center justify-center text-xs shrink-0">
                {idx + 1}
              </span>
              <span className="line-clamp-2">{decodeHTML(p.show_name)}</span>
            </h3>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1">
              <span>{p.genre}</span>
              <span>•</span>
              <span>{p.total_episodes} Episodes</span>
              <span>•</span>
              <span>Last active: {p.latest_episode_date ? new Date(p.latest_episode_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1 font-medium">
              <span>👀 {Math.round(p.average_views_per_episode || 0).toLocaleString()} Avg Views/Ep</span>
              <span>•</span>
              <span>👍 {p.average_views_per_episode ? ((p.average_likes_per_episode / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}% Likes</span>
              <span>•</span>
              <span>💬 {p.average_views_per_episode ? ((p.average_comments_per_episode / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}% Comments</span>
              <span>•</span>
              <span className="text-primary font-bold">🎯 {p.average_views_per_episode ? (((p.average_likes_per_episode + p.average_comments_per_episode) / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}% Aud Efficiency</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-3xl font-black text-primary">{p.final_score}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Final Score</div>
          <button onClick={() => handleDelete(p.playlist_id)} className="text-red-500 text-xs hover:underline mt-2">Delete</button>
        </div>
      </div>

      <div className="flex border-t pt-2 gap-2 mt-2">
        <Button variant="ghost" className="flex-1 text-xs uppercase font-semibold hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] transition-all cursor-pointer group" onClick={toggleExpand}>
          <span className="group-hover:rotate-12 transition-transform duration-200 ease-in-out mr-2">👆</span> 
          {expanded ? "Hide Sample Videos" : "View Sample Videos"}
        </Button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 mt-2 bg-muted/20 p-4 rounded-lg">
          {loading && <div className="text-sm text-muted-foreground text-center py-2">Loading sample videos...</div>}
          {!loading && videos.length === 0 && <div className="text-sm text-muted-foreground text-center py-2">No videos found or failed to fetch.</div>}
          {!loading && videos.map((video, vIdx) => (
            <div key={vIdx} className="flex gap-4 bg-background p-3 rounded-lg items-start border">
              <iframe
                width="240"
                height="135"
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-md shrink-0"
              ></iframe>
              <div className="flex flex-col flex-1">
                <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline line-clamp-2">
                  {video.title}
                </a>
                <span className="text-xs text-muted-foreground mt-1">{new Date(video.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

