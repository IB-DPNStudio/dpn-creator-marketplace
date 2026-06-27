"use client";

import { useState } from "react";
import { deleteLabsPlaylist, fetchPlaylistSampleVideos } from "@/app/actions/labs";
import { Button } from "@/components/ui/button";
import { Award, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function LabsClient({ initialPlaylists }: { initialPlaylists: any[] }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [loading, setLoading] = useState(false);
  
  const [languageFilter, setLanguageFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");

  const uniqueLanguages = Array.from(new Set(initialPlaylists.map(p => p.primary_language || 'Unknown'))).filter(Boolean);
  const uniqueGenres = Array.from(new Set(initialPlaylists.map(p => p.genre || 'General'))).filter(Boolean);

  const filteredPlaylists = playlists.filter(p => {
    if (languageFilter !== "All" && (p.primary_language || 'Unknown') !== languageFilter) return false;
    if (genreFilter !== "All" && (p.genre || 'General') !== genreFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test playlist?")) return;
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header matching main site */}
      <div className="bg-dentsu w-full py-20 px-4 md:px-8 border-b border-border shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold uppercase tracking-widest text-white/80 bg-black/20 rounded-full backdrop-blur-sm border border-white/10">
            Internal Alpha
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
            Labs Ranking Engine
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow">
            Isolated environment testing the new playlist-based ranking logic. Changes here do not affect the main DPN Ranker.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
          <h2 className="text-xl font-bold font-heading">Ranked Playlists ({filteredPlaylists.length})</h2>
          <div className="flex gap-3">
            <select className="bg-background border border-border text-sm p-2 rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
              <option value="All">All Languages</option>
              {uniqueLanguages.map(l => <option key={l as string} value={l as string}>{l as React.ReactNode}</option>)}
            </select>
            <select className="bg-background border border-border text-sm p-2 rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="All">All Genres</option>
              {uniqueGenres.map(g => <option key={g as string} value={g as string}>{g as React.ReactNode}</option>)}
            </select>
          </div>
        </div>
        
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-4 md:p-6 text-xs font-bold text-muted-foreground uppercase tracking-widest w-24">Rank</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[300px]">Podcast</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">DPN Score</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">Score Breakdown</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-muted-foreground uppercase tracking-widest w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlaylists.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      No playlists match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredPlaylists.map((p, idx) => (
                    <PlaylistTableRow key={p.id} rank={idx + 1} p={p} handleDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaylistTableRow({ rank, p, handleDelete }: { rank: number, p: any, handleDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  const breakdown = p.score_breakdown || { views: 0, audience_efficiency: 0, freshness: 0, depth: 0, consistency: 0, confidence: 0 };
  
  // Calculate relative percentages for the UI bar based on weights in score_playlist.ts
  const viewsWidth = breakdown.views * 0.20;
  const effWidth = breakdown.audience_efficiency * 0.20;
  const freshWidth = breakdown.freshness * 0.20;
  const depthWidth = breakdown.depth * 0.15;
  const consWidth = breakdown.consistency * 0.10;
  
  // Normalize to 100% for the visual bar 
  const total = viewsWidth + effWidth + freshWidth + depthWidth + consWidth || 1;
  const vP = (viewsWidth / total) * 100;
  const eP = (effWidth / total) * 100;
  const fP = (freshWidth / total) * 100;
  const dP = (depthWidth / total) * 100;
  const cP = (consWidth / total) * 100;

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
    <>
      <tr className={`group transition-colors hover:bg-muted/20 ${expanded ? 'bg-muted/10' : 'bg-card'}`}>
        <td className="p-4 md:p-6 align-middle">
          <div className="flex items-center gap-2">
            {rank <= 3 ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                rank === 1 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                rank === 2 ? 'bg-slate-400/20 text-slate-600 dark:text-slate-300' :
                'bg-amber-700/20 text-amber-700 dark:text-amber-500'
              }`}>
                <Award className="w-4 h-4 mr-0.5"/>{rank}
              </div>
            ) : (
              <span className="font-mono font-bold text-xl text-foreground pl-2">{rank}</span>
            )}
          </div>
        </td>
        <td className="p-4 md:p-6 align-middle">
          <div className="flex items-center gap-4">
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt="thumbnail" className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover shadow-sm shrink-0 border border-border" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
                {(Array.from(decodeHTML(p.show_name).trim())[0] || '?').toUpperCase()}
              </div>
            )}
            <div className="flex flex-col justify-center">
              <span className="font-bold text-base text-foreground flex items-center gap-2">
                {decodeHTML(p.show_name)}
              </span>
              <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground mt-1.5 gap-2 font-medium tracking-wide">
                <span className="bg-muted px-2 py-0.5 rounded-full">{p.genre}</span>
                <span className="bg-muted px-2 py-0.5 rounded-full">{p.primary_language}</span>
                <span className="bg-muted px-2 py-0.5 rounded-full">{p.total_episodes} Episodes</span>
              </div>
            </div>
          </div>
        </td>
        <td className="p-4 md:p-6 align-middle text-right">
          <span className="font-mono font-black text-2xl text-primary drop-shadow-sm">
            {p.final_score.toFixed(1)}
          </span>
        </td>
        <td className="p-4 md:p-6 align-middle">
          <div className="flex items-center gap-1.5">
            <div className="h-2 flex rounded-full overflow-hidden bg-muted w-32 md:w-48 shadow-inner">
              <div style={{ width: `${vP}%` }} className="bg-blue-500" title={`Views: ${breakdown.views}%`} />
              <div style={{ width: `${eP}%` }} className="bg-purple-500" title={`Efficiency: ${breakdown.audience_efficiency}%`} />
              <div style={{ width: `${fP}%` }} className="bg-emerald-500" title={`Freshness: ${breakdown.freshness}%`} />
              <div style={{ width: `${dP}%` }} className="bg-amber-500" title={`Depth: ${breakdown.depth}%`} />
              <div style={{ width: `${cP}%` }} className="bg-rose-500" title={`Consistency: ${breakdown.consistency}%`} />
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 flex gap-2 font-mono">
            <span className="text-blue-500 dark:text-blue-400" title="Views">V:{Math.round(breakdown.views)}</span>
            <span className="text-purple-500 dark:text-purple-400" title="Audience Efficiency">E:{Math.round(breakdown.audience_efficiency)}</span>
            <span className="text-emerald-500 dark:text-emerald-400" title="Freshness">F:{Math.round(breakdown.freshness)}</span>
            <span className="text-amber-500 dark:text-amber-400" title="Depth">D:{Math.round(breakdown.depth)}</span>
            <span className="text-rose-500 dark:text-rose-400" title="Consistency">C:{Math.round(breakdown.consistency)}</span>
          </div>
        </td>
        <td className="p-4 md:p-6 align-middle text-right">
          <button 
            onClick={toggleExpand}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={5} className="p-6">
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background rounded-xl border border-border">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Avg Views/Ep</span>
                  <span className="font-mono font-bold text-foreground text-sm">{(p.average_views_per_episode || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col border-l pl-4 border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Like Rate</span>
                  <span className="font-mono font-bold text-foreground text-sm">{p.average_views_per_episode ? ((p.average_likes_per_episode / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}%</span>
                </div>
                <div className="flex flex-col border-l pl-4 border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Comment Rate</span>
                  <span className="font-mono font-bold text-foreground text-sm">{p.average_views_per_episode ? ((p.average_comments_per_episode / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}%</span>
                </div>
                <div className="flex flex-col border-l pl-4 border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Audience Efficiency</span>
                  <span className="font-mono font-bold text-primary text-sm">{p.average_views_per_episode ? (((p.average_likes_per_episode + p.average_comments_per_episode) / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Sample Videos</h4>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.playlist_id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Playlist
                  </Button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {loading && <div className="text-sm text-muted-foreground text-center py-4">Loading sample videos...</div>}
                  {!loading && videos.length === 0 && <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">No videos found or failed to fetch.</div>}
                  {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos.map((video, vIdx) => (
                        <div key={vIdx} className="flex flex-col gap-2 bg-background p-3 rounded-xl border border-border shadow-sm group">
                          <iframe
                            width="100%"
                            height="180"
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-lg bg-muted"
                          ></iframe>
                          <div className="flex flex-col mt-1 px-1">
                            <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {decodeHTML(video.title)}
                            </a>
                            <span className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">{new Date(video.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
