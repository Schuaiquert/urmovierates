import type { Genre } from './review';

export interface Movie {
  id: string;
  title: string;
  year: number;
  synopsis?: string;
  poster?: string;
  trailer?: string;
  duration?: number;
  active: boolean;
  createdAt: string;
  genres: Genre[];
}
