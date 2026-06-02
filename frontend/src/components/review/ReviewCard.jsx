import { Rating } from '../common'

export default function ReviewCard({ review, onDelete }) {
  const { id, rating, text, user, createdAt } = review

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-dark-100 rounded-xl p-5 transition-colors hover:bg-dark-100/80">
      <div className="flex justify-between items-start gap-4">
        {/* User Info & Rating */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Avatar */}
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

        {/* Date & Actions */}
        <div className="text-right flex-shrink-0">
          <p className="text-gray-500 text-sm mb-2">{formattedDate}</p>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="text-gray-600 hover:text-red-400 text-sm transition-colors"
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Review Text */}
      {text && (
        <p className="text-gray-300 mt-3 leading-relaxed">{text}</p>
      )}
    </div>
  )
}