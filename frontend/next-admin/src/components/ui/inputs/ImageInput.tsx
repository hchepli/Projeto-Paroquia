'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react';
import { Upload, FilePlus, X } from 'lucide-react';
import FieldLabel from './FieldLabel';

interface ImageInputProps {
  label: string;
  required?: boolean;
  helperText?: string; // ex: "JPEG, PNG, JPG e WEBP"
  /** Atributo accept do input. Padrão: qualquer imagem. */
  accept?: string;
  disabled?: boolean;

  // ---- Modo de 1 arquivo (padrão) ----
  file?: File | null;
  onChange?: (file: File | null) => void;
  /** Devolve a mensagem de erro (ou null se o arquivo é válido). */
  validate?: (file: File) => string | null;
  /** Imagem já salva (edição). Aparece como prévia quando não há arquivo novo. */
  existingUrl?: string | null;
  /** Chamado ao clicar no X da imagem já salva. Sem ele, o X não aparece nela. */
  onRemoveExisting?: () => void;

  // ---- Modo de vários arquivos ----
  /** Aceita vários arquivos. Sem prévia e sem validação: o pai recebe tudo e decide. */
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}

export default function ImageInput({
  label,
  required,
  helperText = 'JPEG, PNG, JPG e WEBP',
  accept = 'image/*',
  disabled = false,
  file = null,
  onChange,
  validate,
  existingUrl = null,
  onRemoveExisting,
  multiple = false,
  onFiles,
}: ImageInputProps) {
  const [error, setError] = useState<string | null>(null);

  // Prévia derivada do arquivo; liberada quando troca ou sai da tela.
  const localPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const preview = multiple ? null : (localPreview ?? existingUrl);

  function handleFiles(list: FileList | null | undefined) {
    if (disabled || !list || list.length === 0) return;

    // Vários: entrega tudo ao pai (ele separa aceitas e recusadas, com motivo).
    if (multiple) {
      setError(null);
      onFiles?.(Array.from(list));
      return;
    }

    const newFile = list[0];
    if (!newFile.type.startsWith('image/')) {
      setError('Esse arquivo não é uma imagem.');
      return;
    }
    const problem = validate?.(newFile) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onChange?.(newFile);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove() {
    setError(null);
    if (file) onChange?.(null); // desfaz a escolha nova (volta à imagem salva, se houver)
    else onRemoveExisting?.(); // tira a imagem salva
  }

  const canRemove = !!file || (!!existingUrl && !!onRemoveExisting);

  return (
    <div className="space-y-2">
      <FieldLabel label={label} required={required} />

      <div
        className={`border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50 transition ${
          disabled ? 'pointer-events-none opacity-50' : 'hover:border-gray-500'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        aria-disabled={disabled}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-600">
          <Upload className="h-10 w-10 text-gray-500" />
          <p>Escolha um arquivo ou arraste & solte aqui</p>
          <p className="text-xs text-gray-400">{helperText}</p>

          <label className="inline-flex items-center mt-3 px-4 py-2 border rounded text-sm text-gray-700 border-gray-400 hover:bg-gray-100 transition cursor-pointer">
            {preview ? 'Trocar imagem' : 'Procure'}
            <FilePlus className="ml-2 h-4 w-4" />
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {preview && (
            <div className="relative mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Prévia da imagem" className="h-32 w-48 rounded-lg object-cover" />
              {canRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  aria-label="Tirar imagem"
                  className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 rounded-full bg-[#701513] text-white hover:bg-[#5a100f] transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}