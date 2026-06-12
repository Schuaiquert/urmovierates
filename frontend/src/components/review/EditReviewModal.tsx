'use client';

import { Modal } from '@/components/common/Modal';
import { ReviewForm } from './ReviewForm';
import type { Review } from '@/types';

interface EditReviewModalProps {
  open: boolean;
  review: Review;
  onClose: () => void;
  onSave: (data: { rating: number; text: string }) => Promise<void>;
  loading?: boolean;
}

export function EditReviewModal({
  open, review, onClose, onSave, loading,
}: EditReviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Editar avaliação" size="md">
      <div className="p-6">
        <ReviewForm
          initialValues={{
            rating: review.rating,
            text: review.text ?? '',
          }}
          onSubmit={onSave}
          loading={loading}
          submitLabel="Salvar alterações"
        />
      </div>
    </Modal>
  );
}
