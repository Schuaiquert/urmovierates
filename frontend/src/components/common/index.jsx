// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }
  return (
    <div
      className={`${sizes[size]} border-gray-700 border-t-primary-500 rounded-full animate-spin ${className}`}
    />
  )
}

// Button
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white',
    outline: 'border border-gray-600 hover:bg-gray-800 active:bg-gray-700 text-gray-300',
    ghost: 'hover:bg-gray-800 active:bg-gray-700 text-gray-300',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}

// Input
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
      <input
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}

// Textarea
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
      <textarea
        className={`input min-h-[100px] resize-none ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}

// Card
export function Card({ children, className = '', hoverable = true, ...props }) {
  return (
    <div
      className={`bg-dark-100 rounded-xl overflow-hidden ${hoverable ? 'card' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Badge
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    primary: 'bg-primary-600/20 text-primary-400',
    success: 'bg-green-600/20 text-green-400',
    warning: 'bg-yellow-600/20 text-yellow-400',
    error: 'bg-red-600/20 text-red-400',
  }
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Rating Stars
export function Rating({ value = 0, max = 5, size = 'md', interactive = false, onChange }) {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }
  return (
    <div className={`flex gap-0.5 ${interactive ? 'cursor-pointer' : ''}`}>
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i + 1)}
          className={`${sizes[size]} ${interactive ? 'hover:scale-110 transition-transform cursor-pointer' : 'cursor-default'} ${i < value ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// Empty State
export function EmptyState({ icon = '🎬', message = 'Nenhum item encontrado', action, onAction }) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-gray-400 text-lg mb-4">{message}</p>
      {action && onAction && (
        <Button variant="outline" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}

// Error State
export function ErrorState({ message = 'Algo deu errado', onRetry }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="text-red-400 text-lg mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

// Pagination
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Anterior
      </Button>

      <span className="px-4 py-2 text-gray-400">
        {page} <span className="text-gray-600">de</span> {pages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page === pages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima →
      </Button>
    </div>
  )
}

// Loading Skeleton
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
  )
}

// Movie Card Skeleton
export function MovieCardSkeleton() {
  return (
    <div className="bg-dark-100 rounded-xl overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}