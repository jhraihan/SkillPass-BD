import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Accessible dialog built on <dialog>: focus is trapped, Escape and backdrop click close it.
 * <Modal open={open} onClose={() => setOpen(false)} title="…" footer={<Button>…</Button>}>…</Modal>
 */
export default function Modal({ open, onClose, title, size = 'md', footer, children }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose?.();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/50',
        SIZES[size],
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-4 sm:p-5">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              className="-m-2 ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label={t('actions.close')}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 p-4 sm:p-5">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
