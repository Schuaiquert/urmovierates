import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({ message = 'Algo deu errado', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400 mb-4">
        <AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <p className="text-red-400 text-lg mb-4">{message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}
