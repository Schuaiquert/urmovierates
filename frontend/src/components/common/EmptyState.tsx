import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface Props {
  icon?: LucideIcon;
  message?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, message = 'Nenhum item encontrado', action, onAction }: Props) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-100 text-gray-500 mb-4">
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <p className="text-gray-400 text-lg mb-4">{message}</p>
      {action && onAction && <Button variant="outline" onClick={onAction}>{action}</Button>}
    </div>
  );
}
