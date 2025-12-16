export interface Matchup {
  home_team: string;
  away_team: string;
  home_avg: number;
  away_avg: number;
  home_win_prob: number;
  away_win_prob: number;
  tie_prob: number;
  trials: number;
  home_team_url: string;
  away_team_url: string;
  home_current_score?: number;
  away_current_score?: number;
  daily_scores?: number[];
}

export interface OddsResponse {
  week_start: string;
  week_end: string;
  date: string;
  runtime_seconds?: number;
  matchups: Matchup[];
  proj_scores: Record<string, number>;
  win_probs: Record<string, number>;
  current_scores: Record<string, number>;
  is_live: boolean;
}
//https://fantasyprediction.onrender.com
//http://192.168.179.204:8000
export const API_BASE_URL = "http://192.168.179.204:8000";

export async function getTodayOdds(): Promise<OddsResponse> {
  const response = await fetch(`${API_BASE_URL}/odds/weekly`);

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OddsResponse;
  return data;
}

export async function getCustomOdds(
  team1: string,
  team2: string,
  trials = 20000,
): Promise<Matchup> {
  const params = new URLSearchParams({
    team1,
    team2,
    trials: trials.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/odds/custom?${params.toString()}`);

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as Matchup;
  return data;
}
