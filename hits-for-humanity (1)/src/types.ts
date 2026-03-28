export interface Match {
  id: number;
  date: string;
  team1: string;
  team2: string;
  venue: string;
  winner?: string;
}

export interface Prediction {
  matchId: number;
  winner: string;
}
