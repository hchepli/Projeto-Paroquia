'use client';

import { useState } from 'react';
import { Upload, FilePlus, X } from 'lucide-react';
import FieldLabel from './FieldLabel';

interface ImageInputProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  helperText?: string; // ex: "JPEG, PNG, JPG e WEBP"
}

export default function ImageInput({
  label,
  file,
  onChange,
  required,
  helperText = 'JPEG, PNG, JPG e WEBP',
}: ImageInputProps) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(newFile: File | undefined) {
    if (newFile && newFile.type.startsWith('image/')) {
      onChange(newFile);
      setPreview(URL.createObjectURL(newFile));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }

  function removeFile() {
    onChange(null);
    setPreview(null);
  }

  return (
    <div className="space-y-2">
      <FieldLabel label={label} required={required} />

      <div
        className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50 cursor-pointer hover:border-gray-500 transition"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-600">
          <Upload className="h-10 w-10 text-gray-500" />
          <p>Escolha um arquivo ou arraste & solte aqui</p>
          <p className="text-xs text-gray-400">{helperText}</p>

          <label className="inline-flex items-center mt-3 px-4 py-2 border rounded text-sm text-gray-700 border-gray-400 hover:bg-gray-100 transition cursor-pointer">
            Procure
            <FilePlus className="ml-2 h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          {preview && (
            <div className="relative mt-4">
              <img src={preview} alt="Preview" className="h-32 w-48 rounded-lg object-cover" />
              <button
                type="button"
                onClick={removeFile}
                className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 rounded-full bg-[#701513] text-white hover:bg-[#5a100f] transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}