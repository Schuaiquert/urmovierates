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
  updatedAt: string;
  /** Marca se o comentário foi removido (soft delete). */
  isDeleted?: boolean;
  /** Data ISO da remoção. Presente apenas quando isDeleted=true. */
  deletedAt?: string | null;
  /** Texto do motivo da remoção. Sempre presente em isDeleted=true
   *  (obrigatório pelo backend). */
  deletionReason?: string | null;
  /** Quem removeu (autor ou admin). Incluído via `include: { deletedBy }`. */
  deletedBy?: Pick<User, 'id' | 'name'> | null;
  deletedById?: number | null;
}

export interface ReviewStats {
  average: number;
  count: number;
}
