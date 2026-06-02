import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Rating } from '../common'

export default function ReviewForm({ onSubmit, loading }) {
  const { isAuthenticated } = useAuth()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Selecione uma nota de 1 a 5')
      return
    }
    setError('')
    try {
      await onSubmit({ rating, text })
      setRating(0)
      setText('')
    } catch (err) {
      setError(err.userMessage || 'Erro ao publicar avaliação')
    }
  }

  const charCount = text.length
  const maxChars = 1000

  if (!isAuthenticated) {
    return (
      <div className="bg-dark-100 rounded-xl p-6 text-center">
        <p className="text-gray-300 mb-4">Faça login para avaliar este filme</p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 bg-dark-300 hover:bg-dark-400 text-gray-200 rounded-lg transition-colors"
          >
            Cadastrar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Avalie este filme</h3>

      {/* Rating Stars */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">Sua nota</label>
        <Rating value={rating} size="lg" interactive onChange={setRating} />
        {rating > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {rating === 1 && 'Não gostou'}
            {rating === 2 && 'Regular'}
            {rating === 3 && 'Bom'}
            {rating === 4 && 'Ótimo'}
            {rating === 5 && 'Excelente!'}
          </p>
        )}
      </div>

      {/* Text Review */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Seu comentário <span className="text-gray-600">(opcional)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          placeholder="O que você achou do filme? Conte sua experiência..."
          className="input min-h-[120px] resize-none"
          rows={4}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-gray-600 text-xs">{charCount}/{maxChars}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        disabled={rating === 0}
        className="w-full"
      >
        Publicar Avaliação
      </Button>
    </form>
  )
}