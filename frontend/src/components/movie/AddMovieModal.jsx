import { useState } from 'react'
import { Input, Textarea, Button } from '../common'
import { moviesAPI } from '../../services/api'

export function AddMovieModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    synopsis: '',
    poster: '',
    trailer: '',
    genres: [],
    duration: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'genres') {
      const options = [...e.target.selectedOptions].map(opt => opt.value)
      setFormData(prev => ({ ...prev, genres: options }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        year: parseInt(formData.year) || null,
        duration: parseInt(formData.duration) || null,
      }
      await moviesAPI.create(data)
      await onAdd()
      onClose()
    } catch (err) {
      setError(err.userMessage || 'Erro ao adicionar filme')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-100 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-gray-100">Adicionar Novo Filme</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Input
            label="Título"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <Input
            label="Ano"
            name="year"
            type="number"
            value={formData.year}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Gêneros</label>
            <select
              name="genres"
              multiple
              value={formData.genres}
              onChange={handleChange}
              className="w-full bg-dark-300 text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:border-primary-500 focus:outline-none min-h-[120px]"
            >
              <option value="Ação">Ação</option>
              <option value="Animação">Animação</option>
              <option value="Aventura">Aventura</option>
              <option value="Comédia">Comédia</option>
              <option value="Drama">Drama</option>
              <option value="Fantasia">Fantasia</option>
              <option value="Ficção Científica">Ficção Científica</option>
              <option value="Horror">Horror</option>
              <option value="Romance">Romance</option>
              <option value="Suspense">Suspense</option>
              <option value="Terror">Terror</option>
              <option value="Thriller">Thriller</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Segure Ctrl (ou Cmd) para selecionar múltiplos gêneros</p>
          </div>

          <Input
            label="Duração (minutos)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
          />

          <Input
            label="Poster (URL)"
            name="poster"
            value={formData.poster}
            onChange={handleChange}
          />

          <Input
            label="Trailer (URL)"
            name="trailer"
            value={formData.trailer}
            onChange={handleChange}
          />

          <Textarea
            label="Sinopse"
            name="synopsis"
            value={formData.synopsis}
            onChange={handleChange}
            rows={4}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="primary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Adicionar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}