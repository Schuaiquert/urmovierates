import type { User } from './user';

export interface Genre {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  rating: number;
  text?: string | null;
  movieId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface ReviewStats {
  average: number;
  count: number;
}
