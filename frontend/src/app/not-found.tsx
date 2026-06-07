import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-bold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Página não encontrada</h2>
      <p className="text-gray-400 mb-8">A página que você procura não existe.</p>
      <Link href="/" className="btn btn-primary">Voltar para Home</Link>
    </div>
  );
}
