import type { Genre } from './review';

export interface Movie {
  id: string;
  title: string;
  year: number;
  synopsis?: string | null;
  poster?: string | null;
  trailer?: string | null;
  duration?: number | null;
  active: boolean;
  createdAt: string;
  genres: Genre[];
}
