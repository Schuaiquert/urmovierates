import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Página não encontrada</h2>
      <p className="text-gray-400 mb-8">A página que você procura não existe.</p>
      <Link to="/" className="btn btn-primary">Voltar para Home</Link>
    </div>
  )
}