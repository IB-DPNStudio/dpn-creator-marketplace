"use client";

import { useState } from "react";
import { deleteLabsPlaylist, fetchPlaylistSampleVideos, updateLabsPlaylistGenre, updateLabsPlaylistLanguage } from "@/app/actions/labs";
import { Award, Trash2, ChevronDown, ChevronUp, Search, TrendingUp, ArrowUpDown, Eye, Heart, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PODCAST_GENRES } from "@/lib/constants";

export default function LabsClient({ initialPlaylists, isAdmin }: { initialPlaylists: any[], isAdmin: boolean }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("final_score");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");

  const uniqueLanguages = Array.from(new Set(initialPlaylists.map(p => p.primary_language || 'Unknown'))).filter(Boolean);
  const uniqueGenres = Array.from(new Set(initialPlaylists.map(p => p.genre || 'General'))).filter(Boolean);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortColumn(col);
      setSortDirection(col === "show_name" || col === "genre" ? "asc" : "desc");
    }
  };

  const filteredAndRankedPlaylists = playlists
    .filter(p => {
      const matchesSearch = p.show_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLanguage = languageFilter === "All" || (p.primary_language || 'Unknown') === languageFilter;
      const matchesGenre = genreFilter === "All" || (p.genre || 'General') === genreFilter;
      return matchesSearch && matchesLanguage && matchesGenre;
    })
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
    .map((p, index) => ({ ...p, displayRank: index + 1 }));

  const sortedPlaylists = [...filteredAndRankedPlaylists].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test playlist?")) return;
    setLoading(true);
    try {
      const res = await deleteLabsPlaylist(id);
      if (res.success) {
        setPlaylists(prev => prev.filter(p => p.playlist_id !== id));
      } else {
        alert(res.error || "Failed to delete");
      }
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

      <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 flex flex-col gap-6">
        
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search playlists..." 
              className="pl-9 h-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
              <option value="All">All Languages</option>
              {uniqueLanguages.map(l => <option key={l as string} value={l as string}>{l as React.ReactNode}</option>)}
            </select>
            <select className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="All">All Genres</option>
              {uniqueGenres.map(g => <option key={g as string} value={g as string}>{g as React.ReactNode}</option>)}
            </select>
          </div>
        </div>
        
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 w-40 text-center font-bold">Rank</th>
                  <th className="p-4 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('show_name')}>
                    <div className="flex items-center gap-1">Creator <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                  </th>
                  <th className="p-4 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('total_episodes')}>
                    <div className="flex items-center gap-1">Episodes <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                  </th>
                  <th className="p-4 font-bold text-right cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('average_views_per_episode')}>
                    <div className="flex items-center justify-end gap-1">Avg Views <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                  </th>
                  <th className="p-4 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('genre')}>
                    <div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                  </th>
                  <th className="p-4 font-bold text-right cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('final_score')}>
                    <div className="flex items-center justify-end gap-2">
                      <span className="flex items-center gap-1">DPN Score <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></span>
                    </div>
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedPlaylists.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No playlists match the current filters.
                    </td>
                  </tr>
                ) : (
                  sortedPlaylists.map((p, idx) => (
                    <PlaylistTableRow key={p.playlist_id || idx} rank={p.displayRank} p={p} handleDelete={handleDelete} isAdmin={isAdmin} />
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

function PlaylistTableRow({ rank, p, handleDelete, isAdmin }: { rank: number, p: any, handleDelete: (id: string) => void, isAdmin: boolean }) {
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
    <>
      <tr className={`transition-colors group hover:bg-muted/30 cursor-pointer ${expanded ? 'bg-muted/10' : 'bg-card'}`} onClick={toggleExpand}>
        <td className="p-4 text-center border-r border-border/50">
          <div className="flex flex-col items-center justify-center gap-2">
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
                <span className="font-mono font-bold text-xl text-foreground">{rank}</span>
              )}
              <span className="text-xs font-bold w-6 text-muted-foreground">-</span>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center space-x-4 transition-all duration-300">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shadow-sm group-hover:border-dentsu transition-colors flex-shrink-0">
              {p.thumbnail_url ? (
                <img src={p.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-primary font-bold">
                  {(Array.from(decodeHTML(p.show_name).trim())[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-base text-foreground group-hover:text-dentsu transition-colors flex items-center gap-2">
                {decodeHTML(p.show_name)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex flex-col items-start gap-1">
                {p.channel_name || 'YouTube Channel'}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="transition-all duration-300">
            <div className="font-mono font-bold">
              {p.total_episodes}
            </div>
            <div className="text-xs text-muted-foreground">Episodes</div>
          </div>
        </td>
        <td className="p-4 text-right">
          <div className="transition-all duration-300">
            <div className="font-mono font-bold text-green-600 flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" />
              {p.average_views_per_episode !== null && p.average_views_per_episode !== undefined ? (p.average_views_per_episode > 1000000 ? (p.average_views_per_episode / 1000000).toFixed(1) + 'M' : p.average_views_per_episode > 1000 ? (p.average_views_per_episode / 1000).toFixed(1) + 'k' : Math.round(p.average_views_per_episode)) : 'N/A'}
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col gap-2 items-start transition-all duration-300">
            {isAdmin ? (
              <select
                className="text-xs px-2 py-1.5 rounded border border-input bg-background max-w-[140px] focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
                value={p.genre || 'General'}
                onChange={async (e) => {
                  const newGenre = e.target.value;
                  await updateLabsPlaylistGenre(p.playlist_id, newGenre);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="" disabled>Select...</option>
                {PODCAST_GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold tracking-wide text-foreground uppercase mt-0.5">
                {p.genre || 'General'}
              </span>
            )}
            
            {isAdmin ? (
              <input
                type="text"
                className="text-xs px-2 py-1.5 rounded border border-input bg-background w-[140px] focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
                defaultValue={p.primary_language || 'English'}
                onBlur={async (e) => {
                  if (e.target.value !== p.primary_language) {
                    await updateLabsPlaylistLanguage(p.playlist_id, e.target.value);
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-[11px] font-medium text-muted-foreground">
                {p.primary_language || 'English'}
              </span>
            )}
          </div>
        </td>
        <td className="p-4 text-right">
          <div className="flex items-center justify-end space-x-3">
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-spotify/10">
              <TrendingUp className="w-4 h-4 text-spotify" />
              <span className="text-spotify font-mono font-bold text-lg">
                {p.final_score.toFixed(1) || 'N/A'}
              </span>
            </div>
          </div>
        </td>
        <td className="p-4 text-right">
          <button 
            className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={7} className="p-6">
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-8">
                {/* Chart History Stats */}
                <div className="grid grid-cols-3 bg-background/50 border border-border rounded-xl p-4 md:p-6 shadow-sm mx-auto w-full max-w-4xl mt-2">
                  <div className="flex flex-col items-center justify-center border-r border-border/60">
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Last Week</span>
                    <span className="font-heading font-black text-2xl md:text-3xl text-foreground drop-shadow-sm">-</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-r border-border/60">
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Peak Rank</span>
                    <span className="font-heading font-black text-2xl md:text-3xl text-foreground drop-shadow-sm">{rank}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Weeks in Top 20</span>
                    <span className="font-heading font-black text-2xl md:text-3xl text-foreground drop-shadow-sm">1</span>
                  </div>
                </div>

                {/* About the Creator & Playlist Stats */}
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 flex flex-col gap-3">
                    <h4 className="font-bold text-lg text-foreground font-heading">About the Creator</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description?.trim() ? (
                        decodeHTML(p.description)
                      ) : p.channel_description?.trim() ? (
                        <>
                          {decodeHTML(p.channel_description).substring(0, 300)}... <a href={`https://www.youtube.com/channel/${p.channel_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">more</a>
                        </>
                      ) : (
                        "No description available for this playlist."
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0 grid grid-cols-2 gap-4 h-fit border border-border rounded-xl p-4 bg-background/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Views/Ep</span>
                      <span className="font-mono font-bold text-foreground text-sm">{Math.round(p.average_views_per_episode || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Like Rate</span>
                      <span className="font-mono font-bold text-foreground text-sm">{p.average_views_per_episode ? ((p.average_likes_per_episode / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Comment Rate</span>
                      <span className="font-mono font-bold text-foreground text-sm">{p.average_views_per_episode ? ((p.average_comments_per_episode / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Aud Eff.</span>
                      <span className="font-mono font-bold text-primary text-sm">{p.average_views_per_episode ? (((p.average_likes_per_episode + p.average_comments_per_episode) / p.average_views_per_episode) * 100).toFixed(2) : '0.00'}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Sample Videos</h4>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.playlist_id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Playlist
                    </Button>
                  )}
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
                          <div className="flex flex-col mt-1 px-1 gap-1">
                            <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {decodeHTML(video.title)}
                            </a>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mt-1">
                              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                              {video.views && (
                                <span className="flex items-center gap-1" title="Views">
                                  <Eye className="w-3 h-3" /> {(video.views > 1000000 ? (video.views/1000000).toFixed(1) + 'M' : video.views > 1000 ? (video.views/1000).toFixed(1) + 'k' : video.views)}
                                </span>
                              )}
                              {video.likes && (
                                <span className="flex items-center gap-1" title="Likes">
                                  <Heart className="w-3 h-3" /> {(video.likes > 1000000 ? (video.likes/1000000).toFixed(1) + 'M' : video.likes > 1000 ? (video.likes/1000).toFixed(1) + 'k' : video.likes)}
                                </span>
                              )}
                              {video.comments && (
                                <span className="flex items-center gap-1" title="Comments">
                                  <MessageSquare className="w-3 h-3" /> {(video.comments > 1000000 ? (video.comments/1000000).toFixed(1) + 'M' : video.comments > 1000 ? (video.comments/1000).toFixed(1) + 'k' : video.comments)}
                                </span>
                              )}
                            </div>
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
