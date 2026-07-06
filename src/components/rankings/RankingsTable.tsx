"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Award, Search, Info, ChevronDown, ChevronUp, Loader2, Edit2, Check, X, Eye, EyeOff, Lock, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updatePodcastGenre, updatePodcastLanguage, updatePodcastStatus, togglePodcastScoreVisibility, swapPodcastRanks, toggleAllPodcastScoresVisibility } from "@/app/actions/podcasts";
import { calculateDPNScoreBreakdown } from "@/lib/score";
import { createClient } from "@/utils/supabase/client";
import { PODCAST_GENRES } from "@/lib/constants";
import { calculateHistoricalMetrics } from "@/lib/history_utils";

export function RankingsTable({ podcasts, isAuthenticated = false, isSuperAdmin = false }: { podcasts: any[], isAuthenticated?: boolean, isSuperAdmin?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(isSuperAdmin);
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [tempGenre, setTempGenre] = useState("");
  const [isUpdatingGenre, setIsUpdatingGenre] = useState(false);
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null);
  const [tempLanguage, setTempLanguage] = useState("");
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [gravitonData, setGravitonData] = useState<Record<string, any>>({});
  const [isAuth, setIsAuth] = useState(isAuthenticated);

  const [sortColumn, setSortColumn] = useState<string>("dpn_score");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortColumn(col);
      setSortDirection(col === "show_name" || col === "genre" ? "asc" : "desc");
    }
  };

  useEffect(() => {
    const supabase = createClient();
    
    // Unconditionally fetch and set session on mount to prevent caching issues
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuth(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuth(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetch('/graviton_data.json?t=' + Date.now())
      .then(async (r) => {
        if (!r.ok) return {};
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch(e) {
          return {};
        }
      })
      .then(data => setGravitonData(data))
      .catch(e => console.error("Could not load graviton data:", e));
  }, []);



  const saveGenre = async (podcastId: string) => {
    setIsUpdatingGenre(true);
    try {
      await updatePodcastGenre(podcastId, tempGenre);
    } finally {
      setIsUpdatingGenre(false);
      setEditingGenreId(null);
    }
  };

  const saveLanguage = async (podcastId: string) => {
    setIsUpdatingLanguage(true);
    try {
      await updatePodcastLanguage(podcastId, tempLanguage);
    } finally {
      setIsUpdatingLanguage(false);
      setEditingLanguageId(null);
    }
  };

  const saveStatus = async (podcastId: string) => {
    setIsUpdatingStatus(true);
    try {
      await updatePodcastStatus(podcastId, tempStatus);
    } finally {
      setIsUpdatingStatus(false);
      setEditingStatusId(null);
    }
  };

  const handleMoveUp = async (e: any, index: number) => {
    e.stopPropagation();
    if (index === 0) return;
    const current = sortedPodcasts[index];
    const previous = sortedPodcasts[index - 1];
    const rank1 = gravitonData[current.id]?.manual_rank ?? 1000;
    const rank2 = gravitonData[previous.id]?.manual_rank ?? 1000;
    
    setGravitonData(prev => ({
      ...prev,
      [current.id]: { ...prev[current.id], manual_rank: rank2 },
      [previous.id]: { ...prev[previous.id], manual_rank: rank1 },
    }));
    
    await swapPodcastRanks({ id: current.id, rank: rank1 }, { id: previous.id, rank: rank2 });
  };

  const handleMoveDown = async (e: any, index: number) => {
    e.stopPropagation();
    if (index === sortedPodcasts.length - 1) return;
    const current = sortedPodcasts[index];
    const next = sortedPodcasts[index + 1];
    const rank1 = gravitonData[current.id]?.manual_rank ?? 1000;
    const rank2 = gravitonData[next.id]?.manual_rank ?? 1000;
    
    setGravitonData(prev => ({
      ...prev,
      [current.id]: { ...prev[current.id], manual_rank: rank2 },
      [next.id]: { ...prev[next.id], manual_rank: rank1 },
    }));
    
    await swapPodcastRanks({ id: current.id, rank: rank1 }, { id: next.id, rank: rank2 });
  };

  const handleToggleScore = async (e: any, podcastId: string) => {
    e.stopPropagation();
    const currentStatus = gravitonData[podcastId]?.is_score_hidden || false;
    
    setGravitonData(prev => ({
      ...prev,
      [podcastId]: { ...prev[podcastId], is_score_hidden: !currentStatus }
    }));
    
    await togglePodcastScoreVisibility(podcastId, currentStatus);
  };

  const handleToggleAll = async () => {
    // Check if most are hidden to determine direction
    const total = sortedPodcasts.length;
    const hiddenCount = sortedPodcasts.filter(p => gravitonData[p.id]?.is_score_hidden).length;
    const shouldHideAll = hiddenCount < total / 2; // if less than half are hidden, hide all. else show all.
    
    setGravitonData(prev => {
      const next = { ...prev };
      sortedPodcasts.forEach(p => {
        next[p.id] = { ...next[p.id], is_score_hidden: shouldHideAll };
      });
      return next;
    });

    await toggleAllPodcastScoresVisibility(shouldHideAll);
  };

  // Extract unique languages and genres for filters
  const languages = useMemo(() => {
    const langs = new Set(podcasts.map(p => p.primary_language || 'English'));
    return ["All", ...Array.from(langs).sort()];
  }, [podcasts]);

  const genres = useMemo(() => {
    const gs = new Set(podcasts.map(p => p.genre || 'General'));
    return ["All", ...Array.from(gs).sort()];
  }, [podcasts]);

  // First, apply filters and calculate the rank based purely on DPN score for the filtered set
  const filteredAndRankedPodcasts = useMemo(() => {
    return podcasts
      .filter((p) => {
        const matchesSearch = p.show_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLanguage = languageFilter === "All" || p.primary_language === languageFilter;
        const matchesGenre = genreFilter === "All" || p.genre === genreFilter;
        return matchesSearch && matchesLanguage && matchesGenre;
      })
      .sort((a, b) => (b.dpn_score || 0) - (a.dpn_score || 0))
      .map((p, index) => ({ ...p, displayRank: index + 1 }));
  }, [podcasts, searchTerm, languageFilter, genreFilter, gravitonData]);

  // Then, apply column sorting (which changes order but preserves displayRank)
  const sortedPodcasts = useMemo(() => {
    return [...filteredAndRankedPodcasts]
      .sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        
        if (sortColumn === 'views_last_7_days') {
          valA = (a as any).views_last_7_days || 0;
          valB = (b as any).views_last_7_days || 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [filteredAndRankedPodcasts, sortColumn, sortDirection]);

  return (
    <div className="w-full">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search podcasts..." 
            className="pl-9 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="All">All Languages</option>
            {languages.filter(l => l !== 'All').map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto min-w-[120px]"
          >
            {genres.map(g => (
              <option key={g} value={g}>{g === "All" ? "All Genres" : g}</option>
            ))}
          </select>
        </div>
        {isAdminMode && (
          <button 
            onClick={handleToggleAll} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted border border-border text-foreground hover:bg-muted/80 rounded-lg whitespace-nowrap transition-colors text-sm font-medium"
          >
            {sortedPodcasts.filter(p => gravitonData[p.id]?.is_score_hidden).length < sortedPodcasts.length / 2 ? (
              <><EyeOff className="w-4 h-4" /> Hide All Scores</>
            ) : (
              <><Eye className="w-4 h-4" /> Show All Scores</>
            )}
          </button>
        )}
      </div>

      {/* Ranker Table */}
      <div className="hidden md:block bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 w-40 text-center font-bold">Rank</th>
                <th className="p-4 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('show_name')}>
                  <div className="flex items-center gap-1">Creator <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('subscriber_count')}>
                  <div className="flex items-center gap-1">YT Subs <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                </th>
                <th className="p-4 font-bold text-right cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('views_last_7_days')}>
                  <div className="flex items-center justify-end gap-1">7-Day Views <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('genre')}>
                  <div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                </th>
                <th className="p-4 font-bold text-right cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSort('dpn_score')}>
                  <div className="flex items-center justify-end gap-2">
                    <span className="flex items-center gap-1">DPN Score <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4 bg-slate-950 border border-slate-800 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 text-slate-200 text-left">
                          <p className="text-slate-300 text-xs leading-relaxed">
                            DPN Score is a proprietary quality score that combines audience engagement, publishing activity, content depth, and overall podcast reliability into a single rating.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedPodcasts.map((podcast, index) => {
                const rank = (podcast as any).displayRank;
                const isGated = rank > 10 && !isAuth;
                const metrics = calculateHistoricalMetrics(podcast.podcast_history, rank);
                
                return (
                  <React.Fragment key={podcast.id}>
                    <tr 
                      className={`transition-colors group ${isGated ? 'opacity-70 hover:bg-muted/10 cursor-pointer' : 'hover:bg-muted/30 cursor-pointer'}`}
                      onClick={() => {
                        if (isGated) {
                          window.location.href = "/login";
                        } else {
                          setExpandedId(expandedId === podcast.id ? null : podcast.id);
                        }
                      }}
                    >
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
                          
                          {metrics.rankChange !== null ? (
                            <span className={`text-xs font-bold w-6 ${metrics.rankChange > 0 ? 'text-green-500' : metrics.rankChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {metrics.rankChange > 0 ? `+${metrics.rankChange}` : metrics.rankChange < 0 ? `${metrics.rankChange}` : '-'}
                            </span>
                          ) : (
                            <span className="text-xs font-bold w-6 text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center space-x-4 transition-all duration-300 ${isGated ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shadow-sm group-hover:border-dentsu transition-colors flex-shrink-0">
                          <Image 
                            src={podcast.thumbnail_url || 'https://via.placeholder.com/150'} 
                            alt={podcast.show_name} 
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground group-hover:text-dentsu transition-colors flex items-center gap-2">
                            {podcast.show_name}
                            {metrics.isNew && (
                              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                                New ✨
                              </span>
                            )}
                            {metrics.isTrending && !metrics.isNew && (
                              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                                Trending 🔥
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex flex-col items-start gap-1">
                            {podcast.youtube_url ? (
                              <a href={podcast.youtube_url} target="_blank" rel="noreferrer" className="hover:underline">
                                @{podcast.youtube_url.split('@')[1] || 'YouTube'}
                              </a>
                            ) : 'Podcast'}
                            
                            {editingStatusId === podcast.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <select 
                                  className="text-xs px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                  value={tempStatus}
                                  onChange={(e) => setTempStatus(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="seeded">Regular Podcaster</option>
                                  <option value="verified">Verified</option>
                                  <option value="approved_partner">Approved Partner</option>
                                  <option value="featured_partner">Featured Partner</option>
                                </select>
                                <button disabled={isUpdatingStatus} onClick={(e) => { e.stopPropagation(); saveStatus(podcast.id); }} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                  {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </button>
                                <button disabled={isUpdatingStatus} onClick={(e) => { e.stopPropagation(); setEditingStatusId(null); }} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                {(podcast.status && podcast.status !== 'seeded') && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    podcast.status === 'featured_partner' ? 'bg-dentsu text-white' : 
                                    podcast.status === 'approved_partner' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 
                                    podcast.status === 'verified' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {podcast.status === 'featured_partner' ? 'FEATURED' : podcast.status.replace('_', ' ')}
                                  </span>
                                )}
                                {isAdminMode && (
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setTempStatus(podcast.status || 'seeded'); 
                                      setEditingStatusId(podcast.id); 
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`transition-all duration-300 ${isGated ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                        <div className="font-mono font-bold">
                          {podcast.subscriber_count > 1000000 
                            ? (podcast.subscriber_count / 1000000).toFixed(1) + 'M' 
                            : (podcast.subscriber_count / 1000).toFixed(1) + 'k'}
                        </div>
                        <div className="text-xs text-muted-foreground">Subscribers</div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`transition-all duration-300 ${isGated ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                        <div className="font-mono font-bold text-green-600 flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {(podcast as any).views_last_7_days !== null && (podcast as any).views_last_7_days !== undefined ? ((podcast as any).views_last_7_days > 1000000 ? ((podcast as any).views_last_7_days / 1000000).toFixed(1) + 'M' : ((podcast as any).views_last_7_days / 1000).toFixed(1) + 'k') : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex flex-col gap-2 items-start transition-all duration-300 ${isGated ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                        {isAdminMode ? (
                          <select
                            className="text-xs px-2 py-1.5 rounded border border-input bg-background max-w-[140px] focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
                            value={podcast.genre || 'General'}
                            onChange={async (e) => {
                              const newGenre = e.target.value;
                              await updatePodcastGenre(podcast.id, newGenre);
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
                            {podcast.genre || 'General'}
                          </span>
                        )}
                        {isAdminMode ? (
                          <input
                            type="text"
                            className="text-xs px-2 py-1.5 rounded border border-input bg-background w-[140px] focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
                            defaultValue={podcast.primary_language || 'English'}
                            onBlur={async (e) => {
                              if (e.target.value !== podcast.primary_language) {
                                await updatePodcastLanguage(podcast.id, e.target.value);
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
                            {podcast.primary_language || 'English'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        {isGated ? (
                          <Link 
                            href="/login"
                            className="flex items-center gap-1.5 bg-dentsu hover:bg-dentsu/90 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-md transition-all hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Lock className="w-3.5 h-3.5 text-white" /> Unlock
                          </Link>
                        ) : (
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg ${gravitonData[podcast.id]?.is_score_hidden && !isAdminMode ? 'bg-transparent' : gravitonData[podcast.id]?.is_score_hidden ? 'bg-muted/50' : 'bg-spotify/10'}`}>
                            {gravitonData[podcast.id]?.is_score_hidden && !isAdminMode ? (
                              <Lock className="w-4 h-4 text-muted-foreground/50" />
                            ) : (
                              <>
                                <TrendingUp className={`w-4 h-4 ${gravitonData[podcast.id]?.is_score_hidden ? 'text-muted-foreground' : 'text-spotify'}`} />
                                <span className={`${gravitonData[podcast.id]?.is_score_hidden ? 'text-muted-foreground line-through opacity-70' : 'text-spotify'} font-mono font-bold text-lg`}>
                                  {podcast.dpn_score || 'N/A'}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {isAdminMode && (
                          <button 
                            onClick={(e) => handleToggleScore(e, podcast.id)} 
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            title={gravitonData[podcast.id]?.is_score_hidden ? "Show Score" : "Hide Score"}
                          >
                            {gravitonData[podcast.id]?.is_score_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                        {!isGated && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === podcast.id ? null : podcast.id);
                            }}
                            className="p-1 hover:bg-muted rounded-full transition-colors"
                          >
                            {expandedId === podcast.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === podcast.id && (
                    <tr className="bg-muted/10 border-b border-border">
                      <td colSpan={5} className="p-6">
                        <div className="flex flex-col gap-6">
                          <div className="grid grid-cols-3 gap-4 p-4 bg-background rounded-xl border border-border mt-2">
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Week</span>
                              <span className="font-mono font-bold text-2xl text-foreground">{metrics.lastWeekRank || '-'}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center border-x border-border">
                              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Peak Rank</span>
                              <span className="font-mono font-bold text-2xl text-foreground">{metrics.peakRank || '-'}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weeks in Top 20</span>
                              <span className="font-mono font-bold text-2xl text-foreground">{metrics.weeksInTop20}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg mb-2 text-foreground">About the Creator</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl whitespace-pre-wrap">
                              {podcast.description || "No description provided."}
                            </p>
                          </div>
                          

                          {(podcast.channel_id || podcast.youtube_url) && (
                            <div>
                              <h4 className="font-bold text-lg mb-4 text-foreground font-heading">Latest Content</h4>
                              <div className={`grid grid-cols-1 ${((podcast as any).latest_short_url || (gravitonData[podcast.id]?.latest_short_id && gravitonData[podcast.id].latest_short_id !== 'null')) ? 'md:grid-cols-2' : ''} gap-6 items-start`}>
                                <div className="aspect-video w-full rounded-xl overflow-hidden border border-border bg-black relative">
                                  <iframe 
                                    className="w-full h-full"
                                    src={(podcast as any).latest_video_url 
                                      ? `https://www.youtube.com/embed/${(podcast as any).latest_video_url.split('v=')[1]}`
                                      : gravitonData[podcast.id]?.latest_long_id 
                                      ? `https://www.youtube.com/embed/${gravitonData[podcast.id].latest_long_id}` 
                                      : podcast.channel_id ? `https://www.youtube.com/embed/videoseries?list=${podcast.channel_id?.replace('UC', 'UU')}` : ''} 
                                    title="Latest Video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    loading="lazy"
                                  ></iframe>
                                </div>
                                {((podcast as any).latest_short_url || (gravitonData[podcast.id]?.latest_short_id && gravitonData[podcast.id].latest_short_id !== 'null')) && (
                                  <div className="aspect-[9/16] w-full max-w-[240px] rounded-xl overflow-hidden border border-border bg-black mx-auto md:mx-0 relative">
                                    <iframe 
                                      className="w-full h-full"
                                      src={(podcast as any).latest_short_url
                                        ? `https://www.youtube.com/embed/${(podcast as any).latest_short_url.split('v=')[1]}`
                                        : `https://www.youtube.com/embed/${gravitonData[podcast.id].latest_short_id}`} 
                                      title="Latest Short" 
                                      frameBorder="0" 
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                      allowFullScreen
                                      loading="lazy"
                                    ></iframe>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {sortedPodcasts.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No podcasts match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Ranker List */}
      <div className="md:hidden flex flex-col gap-4">
        {sortedPodcasts.map((podcast, index) => {
          const rank = (podcast as any).displayRank;
          const isGated = rank > 10 && !isAuth;
          const metrics = calculateHistoricalMetrics(podcast.podcast_history, rank);
          
          return (
            <div 
              key={podcast.id}
              className={`relative bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col gap-3 transition-colors ${isGated ? 'opacity-70 cursor-pointer' : 'cursor-pointer hover:border-dentsu/50'}`}
              onClick={() => {
                if (isGated) {
                  window.location.href = "/login";
                } else {
                  setExpandedId(expandedId === podcast.id ? null : podcast.id);
                }
              }}
            >
              <div className={`flex items-start justify-between gap-3 ${isGated ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                <div className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shadow-sm flex-shrink-0">
                    <Image 
                      src={podcast.thumbnail_url || 'https://via.placeholder.com/150'} 
                      alt={podcast.show_name} 
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold text-base text-foreground line-clamp-1 flex items-center gap-2">
                      {podcast.show_name}
                      {metrics.isNew && (
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                          New ✨
                        </span>
                      )}
                      {metrics.isTrending && !metrics.isNew && (
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                          Trending 🔥
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        {rank <= 3 ? (
                          <span className={`inline-flex items-center ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-600'}`}>
                            <Award className="w-3 h-3 mr-0.5"/>#{rank}
                          </span>
                        ) : `#${rank}`}
                        
                        {metrics.rankChange !== null && (
                          <span className={`text-[10px] ${metrics.rankChange > 0 ? 'text-green-500' : metrics.rankChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            ({metrics.rankChange > 0 ? `+${metrics.rankChange}` : metrics.rankChange})
                          </span>
                        )}
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-foreground/80">
                        {podcast.genre || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg ${gravitonData[podcast.id]?.is_score_hidden ? 'bg-muted/50' : 'bg-spotify/10'}`}>
                    <TrendingUp className={`w-3 h-3 ${gravitonData[podcast.id]?.is_score_hidden ? 'text-muted-foreground' : 'text-spotify'}`} />
                    <span className={`${gravitonData[podcast.id]?.is_score_hidden ? 'text-muted-foreground line-through opacity-70' : 'text-spotify'} font-mono font-bold text-sm`}>
                      {podcast.dpn_score || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`flex justify-between items-center text-sm border-t border-border pt-3 mt-1 ${isGated ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                <div>
                  <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Audience: </span>
                  <span className="font-mono font-bold">
                    {podcast.subscriber_count > 1000000 
                      ? (podcast.subscriber_count / 1000000).toFixed(1) + 'M' 
                      : (podcast.subscriber_count / 1000).toFixed(1) + 'k'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] uppercase tracking-wider">7D Views: </span>
                  <span className="font-mono font-bold text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {(podcast as any).views_last_7_days !== null && (podcast as any).views_last_7_days !== undefined ? ((podcast as any).views_last_7_days > 1000000 ? ((podcast as any).views_last_7_days / 1000000).toFixed(1) + 'M' : ((podcast as any).views_last_7_days / 1000).toFixed(1) + 'k') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">Lang:</span>
                  <span className="text-[11px] font-medium text-foreground/80">
                    {podcast.primary_language || 'EN'}
                  </span>
                </div>
              </div>

              {isGated && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-xl z-10">
                  <div className="flex items-center gap-1.5 bg-dentsu text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-lg">
                    <Lock className="w-4 h-4" /> Unlock Rank
                  </div>
                </div>
              )}

              {expandedId === podcast.id && !isGated && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-background rounded-lg border border-border">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Last</span>
                      <span className="font-mono font-bold text-lg text-foreground">{metrics.lastWeekRank || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-x border-border">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Peak</span>
                      <span className="font-mono font-bold text-lg text-foreground">{metrics.peakRank || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Wks</span>
                      <span className="font-mono font-bold text-lg text-foreground">{metrics.weeksInTop20}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                    {podcast.description || "No description provided."}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sortedPodcasts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
            No podcasts match your filters.
          </div>
        )}
      </div>

    </div>
  );
}
