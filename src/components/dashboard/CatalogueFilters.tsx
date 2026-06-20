"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CatalogueFilters({
  genres,
  languages,
}: {
  genres: string[];
  languages: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "All");
  const [lang, setLang] = useState(searchParams.get("lang") || "All");

  // Keep state in sync with URL changes (e.g. back/forward navigation)
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setGenre(searchParams.get("genre") || "All");
    setLang(searchParams.get("lang") || "All");
  }, [searchParams]);

  // Auto-search as you type with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQuery = searchParams.get("q") || "";
      if (search !== currentQuery) {
        updateParams(search, genre, lang);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams(search, genre, lang);
  };

  const updateParams = (s: string, g: string, l: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (s.trim()) {
      params.set("q", s.trim());
    } else {
      params.delete("q");
    }

    if (g && g !== "All") {
      params.set("genre", g);
    } else {
      params.delete("genre");
    }

    if (l && l !== "All") {
      params.set("lang", l);
    } else {
      params.delete("lang");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGenre(val);
    updateParams(search, val, lang);
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLang(val);
    updateParams(search, genre, val);
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by podcast name..."
          className="pl-9 h-12 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 items-center w-full md:w-auto">
        <select
          className="flex h-12 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={lang}
          onChange={handleLangChange}
        >
          <option value="All">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="flex h-12 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={genre}
          onChange={handleGenreChange}
        >
          <option value="All">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <Button 
          type="submit" 
          disabled={isPending} 
          className="col-span-2 sm:col-span-1 h-12 px-6 bg-dentsu hover:bg-dentsu/90 text-white font-semibold w-full sm:w-auto mt-2 sm:mt-0"
        >
          {isPending ? "Filtering..." : "Search"}
        </Button>
      </div>
    </form>
  );
}
