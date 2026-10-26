import { Camera, FileText, Upload, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Field from './Field';

function FileThumb({ file }) {
  const url = useMemo(
    () => (file.type?.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  if (!url) return <FileText className="size-12 p-2 text-gray-400" aria-hidden="true" />;
  return <img src={url} alt="" className="size-12 rounded-lg object-cover" />;
}

/**
 * Pick files or take a photo with the phone camera.
 * <FileUpload label="…" value={files} onChange={setFiles} accept="image/*,application/pdf" camera multiple />
 */
export default function FileUpload({
  label,
  hint,
  error,
  value = [],
  onChange,
  accept = 'image/*,application/pdf',
  multiple = false,
  camera = false,
  maxSizeMB = 5,
  className,
}) {
  const { t } = useTranslation();
  const id = useId();
  const pickerRef = useRef(null);
  const cameraRef = useRef(null);
  const [localError, setLocalError] = useState(null);

  const addFiles = (fileList) => {
    const accepted = [];
    for (const file of Array.from(fileList ?? [])) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setLocalError(t('upload.tooLarge', { name: file.name, max: maxSizeMB }));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setLocalError(null);
    onChange?.(multiple ? [...value, ...accepted] : accepted.slice(0, 1));
  };

  const removeFile = (index) => onChange?.(value.filter((_, i) => i !== index));

  return (
    <Field id={id} label={label} hint={hint} error={error ?? localError} className={className}>
      <div className="flex flex-wrap gap-3">
        {camera && (
          <Button variant="outline" size="lg" icon={Camera} onClick={() => cameraRef.current?.click()}>
            {t('upload.takePhoto')}
          </Button>
        )}
        <Button variant="outline" size="lg" icon={Upload} onClick={() => pickerRef.current?.click()}>
          {t('upload.choose')}
        </Button>
      </div>

      <input
        ref={pickerRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
      {camera && (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      )}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2"
            >
              <FileThumb file={file} />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label={t('upload.remove', { name: file.name })}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}
