const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/rankings/RankingsTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '<div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">',
  '<div className="hidden md:block bg-card border border-border rounded-xl shadow-lg overflow-hidden">'
);

const mobileViewCode = `
      {/* Mobile Ranker List */}
      <div className="md:hidden flex flex-col gap-4">
        {sortedPodcasts.map((podcast, index) => {
          const rank = index + 1;
          const isGated = rank > 10 && !isAuth;
          
          return (
            <div 
              key={podcast.id}
              className={\`relative bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col gap-3 transition-colors \${isGated ? 'opacity-70 cursor-pointer' : 'cursor-pointer hover:border-dentsu/50'}\`}
              onClick={() => {
                if (isGated) {
                  window.location.href = "/login";
                } else {
                  setExpandedId(expandedId === podcast.id ? null : podcast.id);
                }
              }}
            >
              <div className={\`flex items-start justify-between gap-3 \${isGated ? 'blur-[5px] select-none pointer-events-none' : ''}\`}>
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
                    <div className="font-bold text-base text-foreground line-clamp-1">
                      {podcast.show_name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {rank <= 3 ? (
                          <span className={\`inline-flex items-center \${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-600'}\`}>
                            <Award className="w-3 h-3 mr-0.5"/>#{rank}
                          </span>
                        ) : \`#\${rank}\`}
                      </span>
                      <span>•</span>
                      <span>{podcast.genre || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div className={\`inline-flex items-center space-x-1 px-2 py-1 rounded-lg \${gravitonData[podcast.id]?.is_score_hidden ? 'bg-muted/50' : 'bg-spotify/10'}\`}>
                    <TrendingUp className={\`w-3 h-3 \${gravitonData[podcast.id]?.is_score_hidden ? 'text-muted-foreground' : 'text-spotify'}\`} />
                    <span className={\`\${gravitonData[podcast.id]?.is_score_hidden ? 'text-muted-foreground line-through opacity-70' : 'text-spotify'} font-mono font-bold text-sm\`}>
                      {podcast.dpn_score || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={\`flex justify-between items-center text-sm border-t border-border pt-3 mt-1 \${isGated ? 'blur-[5px] select-none pointer-events-none' : ''}\`}>
                <div>
                  <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Audience: </span>
                  <span className="font-mono font-bold">
                    {podcast.subscriber_count > 1000000 
                      ? (podcast.subscriber_count / 1000000).toFixed(1) + 'M' 
                      : (podcast.subscriber_count / 1000).toFixed(1) + 'k'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Lang: </span>
                  <span className="font-medium">{podcast.primary_language || 'EN'}</span>
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
                <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                   {podcast.description || "No description provided."}
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
`;

content = content.replace(
  '      </div>\n    </div>\n  );\n}\n',
  '      </div>\n' + mobileViewCode + '\n    </div>\n  );\n}\n'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Mobile view added to RankingsTable.tsx');
