import React, { useState } from 'react';
import { Upload, FileIcon, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

export interface DocumentUploadProps {
  onFileSelect: (file: File, category: string) => Promise<void>;
  acceptedTypes?: string[];
  maxSize?: number; // en MB
  categories?: string[];
}

const DEFAULT_CATEGORIES = [
  'CV',
  'Diplôme',
  'RIB',
  "Carte d'identité",
  'Attestation',
  'Autre'
];

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp'
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onFileSelect,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = 10,
  categories = DEFAULT_CATEGORIES
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Vérifier le type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non accepté. Formats acceptés : PDF, PNG, JPG, GIF, WEBP'
      };
    }

    // Vérifier la taille (convertir MB en bytes)
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `La taille du fichier dépasse ${maxSize}MB`
      };
    }

    return { valid: true };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    setError(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onFileSelect(selectedFile, selectedCategory);
      setSelectedFile(null);
      setSelectedCategory(categories[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Zone de drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-3 pointer-events-none">
          {selectedFile ? (
            <>
              <FileIcon className="w-12 h-12 text-blue-600" />
              <div className="text-center">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-gray-700">Glissez votre fichier ici</p>
                <p className="text-sm text-gray-500">ou cliquez pour sélectionner</p>
              </div>
              <div className="text-xs text-gray-400">
                PDF, PNG, JPG, GIF, WEBP (max {maxSize}MB)
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Sélection de catégorie et bouton d'upload */}
      {selectedFile && !error && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie du document
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUploading}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-6">
            <Button
              onClick={handleRemoveFile}
              variant="outline"
              size="sm"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? 'Upload...' : 'Uploader'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
