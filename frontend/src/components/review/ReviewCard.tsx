import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Rating } from '@/components/common/Rating';
import { formatDate } from '@/lib/format';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (id: string) => void;
}

export function ReviewCard({
  review, currentUserId, isAdmin, onEdit, onDelete,
}: ReviewCardProps) {
  const {
    id, rating, text, user, createdAt,
    isDeleted, deletedAt, deletedBy, deletionReason,
  } = review;

  const isAuthor = !!currentUserId && currentUserId === user?.id;
  const canEdit = !isDeleted && isAuthor && !!onEdit;
  const canDelete =
    !isDeleted &&
    ((isAuthor && !!onDelete) || (isAdmin && !!onDelete));

  // === Estado: comentário removido (soft delete), visto pelo autor ===
  if (isDeleted && isAuthor) {
    return (
      <article className="bg-dark-100 rounded-xl p-5 border border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-amber-200 font-medium">
              Seu comentário foi removido
              {deletedBy?.name && (
                <>
                  {' '}pelo administrador{' '}
                  <span className="text-amber-100">{deletedBy.name}</span>
                </>
              )}
              {deletedAt && (
                <>
                  {' '}em{' '}
                  <span className="text-amber-100">
                    {formatDate(deletedAt, 'long')}
                  </span>
                </>
              )}
              .
            </p>
            {deletionReason && (
              <p className="text-amber-300/80 text-sm mt-1">
                Motivo: {deletionReason}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              O conteúdo original não está mais visível publicamente.
            </p>
          </div>
        </div>
      </article>
    );
  }

  // === Estado normal ===
  return (
    <article className="bg-dark-100 rounded-xl p-5 transition-colors hover:bg-dark-100/80 border border-white/5">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-semibold">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium text-gray-100">
                {user?.name || 'Anônimo'}{user?.role === 'ADMIN' && ' (ADM)'}
              </p>
              <Rating value={rating} size="sm" />
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
          <p className="text-gray-500 text-sm">{formatDate(createdAt, 'long')}</p>
          {(canEdit || canDelete) && (
            <div className="flex gap-3 text-sm">
              {canEdit && (
                <button
                  onClick={() => onEdit!(review)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-400 transition-colors"
                  aria-label="Editar avaliação"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  Editar
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete!(id)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors"
                  aria-label="Excluir avaliação"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {text && <p className="text-gray-300 mt-3 leading-relaxed">{text}</p>}
    </article>
  );
}
