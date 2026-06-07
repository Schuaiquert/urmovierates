import { Button } from './Button';

interface Props {
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, pages, onPageChange }: Props) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        ← Anterior
      </Button>
      <span className="px-4 py-2 text-gray-400">
        {page} <span className="text-gray-600">de</span> {pages}
      </span>
      <Button variant="outline" size="sm" disabled={page === pages} onClick={() => onPageChange(page + 1)}>
        Próxima →
      </Button>
    </nav>
  );
}
