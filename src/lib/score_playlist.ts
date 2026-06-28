export interface PlaylistScoreInput {
  playlist_id: string;
  total_episodes: number;
  latest_episode_date: string | null;
  average_days_between_episodes: number | null;
  total_views: number;
  average_views_per_episode: number;
  average_likes_per_episode: number;
  average_comments_per_episode: number;
  manual_boost: number;
  manual_penalty: number;
  show_name: string;
  description: string;
  sample_video_titles?: string[];
}

export interface ScoreBreakdown {
  views: number;
  audience_efficiency: number;
  freshness: number;
  depth: number;
  consistency: number;
  confidence: number;
  likes: number;
  comments: number;
}

export interface Explanations {
  positive: string[];
  negative: string[];
}

export interface ScoreOutput {
  final_score: number;
  breakdown: ScoreBreakdown;
  explanations: Explanations;
}

export function calculatePlaylistScore(input: PlaylistScoreInput): ScoreOutput {
  const WEIGHTS = {
    views: 0.20,
    audience_efficiency: 0.20,
    freshness: 0.20,
    depth: 0.15,
    consistency: 0.10,
    confidence: 0.05,
    likes: 0.05,
    comments: 0.05
  };

  const explanations: Explanations = { positive: [], negative: [] };

  // 1. Views Score (20%)
  let viewsScore = 0;
  if (input.average_views_per_episode > 0) {
    viewsScore = Math.min(1, Math.log1p(input.average_views_per_episode) / Math.log1p(100000));
  }
  if (viewsScore > 0.8) explanations.positive.push("Exceptionally high average viewership per episode.");

  // 2. Likes Score (5%)
  let likesScore = 0;
  if (input.average_likes_per_episode > 0) {
    likesScore = Math.min(1, Math.log1p(input.average_likes_per_episode) / Math.log1p(10000));
  }

  // 3. Comments Score (5%)
  let commentsScore = 0;
  if (input.average_comments_per_episode > 0) {
    commentsScore = Math.min(1, Math.log1p(input.average_comments_per_episode) / Math.log1p(1000));
  }

  // 4. Audience Efficiency Score (15%)
  let effScore = 0;
  let engagementRate = 0;
  if (input.average_views_per_episode > 0) {
    engagementRate = (input.average_likes_per_episode + input.average_comments_per_episode) / input.average_views_per_episode;
  }
  if (engagementRate <= 0.0) effScore = 0;
  else if (engagementRate <= 0.01) effScore = (engagementRate / 0.01) * 0.25;
  else if (engagementRate <= 0.02) effScore = 0.25 + ((engagementRate - 0.01) / 0.01) * 0.25;
  else if (engagementRate <= 0.03) effScore = 0.50 + ((engagementRate - 0.02) / 0.01) * 0.25;
  else if (engagementRate <= 0.05) effScore = 0.75 + ((engagementRate - 0.03) / 0.02) * 0.25;
  else effScore = 1.00;
  
  if (effScore > 0.8) explanations.positive.push("Highly engaged community (high likes/comments ratio).");
  else if (effScore < 0.2) explanations.negative.push("Low audience efficiency (low interaction relative to views).");

  // 5. Freshness Score (20%)
  let freshnessScore = 0;
  if (input.latest_episode_date) {
    const daysSinceLast = (new Date().getTime() - new Date(input.latest_episode_date).getTime()) / (1000 * 3600 * 24);
    freshnessScore = Math.max(0, 1 - (daysSinceLast / 90));
    if (freshnessScore > 0.9) explanations.positive.push("Very recent publishing activity.");
    else if (freshnessScore < 0.3) explanations.negative.push("Has not published an episode recently.");
  } else {
    explanations.negative.push("No recent episode data available.");
  }

  // 6. Depth Score (15%)
  let depthScore = Math.min(input.total_episodes, 50) / 50;
  if (depthScore === 1) explanations.positive.push("Deep and robust catalog of episodes.");
  else if (depthScore < 0.2) explanations.negative.push("Very shallow catalog, requires more episodes to build authority.");

  // 7. Consistency Score (10%)
  let consistencyScore = 0;
  if (input.average_days_between_episodes !== null && input.average_days_between_episodes > 0) {
    const gap = input.average_days_between_episodes;
    if (gap >= 1 && gap <= 14) consistencyScore = 1.0;
    else if (gap > 14 && gap <= 21) consistencyScore = 0.8;
    else if (gap > 21 && gap <= 30) consistencyScore = 0.4;
    else consistencyScore = 0.0;
    
    if (consistencyScore === 1.0) explanations.positive.push("Consistent and healthy publishing cadence.");
    else if (consistencyScore <= 0.4) explanations.negative.push("Inconsistent or overly erratic publishing schedule.");
  }

  // 8. Confidence Score (10%)
  const textToSearch = `${input.show_name} ${input.description}`.toLowerCase();
  const keywords = ['podcast', 'episode', 'show', 'host', 'season', 'listen', 'audio', 'interview', 'talk', 'discussion', 'guest'];
  let matches = 0;
  
  // 1. Keyword matching
  for (const keyword of keywords) {
    if (textToSearch.includes(keyword)) matches++;
  }
  
  // 2. Sequential episode numbering check (e.g. Ep 1, #12, Episode 4)
  if (input.sample_video_titles && input.sample_video_titles.length > 0) {
    let hasSequential = false;
    for (const title of input.sample_video_titles) {
      if (/(ep|episode|#)\s*\d+/i.test(title)) {
        hasSequential = true;
        break;
      }
    }
    if (hasSequential) matches += 2; // Treat numbering as strong signal
  }

  let confidenceScore = Math.min(matches, 5) / 5;
  if (confidenceScore >= 0.8) explanations.positive.push("High confidence this is a dedicated podcast show based on metadata.");
  else if (confidenceScore < 0.5) explanations.negative.push("Low metadata confidence; may be a generic playlist rather than a podcast.");

  // Convert raw 0-1 scores to 0-100 for the breakdown UI
  const breakdown: ScoreBreakdown = {
    views: Number((viewsScore * 100).toFixed(2)),
    audience_efficiency: Number((effScore * 100).toFixed(2)),
    freshness: Number((freshnessScore * 100).toFixed(2)),
    depth: Number((depthScore * 100).toFixed(2)),
    consistency: Number((consistencyScore * 100).toFixed(2)),
    confidence: Number((confidenceScore * 100).toFixed(2)),
    likes: Number((likesScore * 100).toFixed(2)),
    comments: Number((commentsScore * 100).toFixed(2))
  };

  let finalScore = (
    (breakdown.views * WEIGHTS.views) +
    (breakdown.audience_efficiency * WEIGHTS.audience_efficiency) +
    (breakdown.freshness * WEIGHTS.freshness) +
    (breakdown.depth * WEIGHTS.depth) +
    (breakdown.consistency * WEIGHTS.consistency) +
    (breakdown.confidence * WEIGHTS.confidence) +
    (breakdown.likes * WEIGHTS.likes) +
    (breakdown.comments * WEIGHTS.comments)
  );

  // Apply overrides
  finalScore = finalScore + input.manual_boost - input.manual_penalty;
  
  // Cap between 0 and 100
  finalScore = Math.max(0, Math.min(100, finalScore));

  return {
    final_score: Number(finalScore.toFixed(2)),
    breakdown,
    explanations
  };
}
