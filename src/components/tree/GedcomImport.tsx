'use client';

/**
 * GEDCOM Import Component
 *
 * Allows users to import GEDCOM files into their family tree.
 * Supports drag & drop, file selection, preview, and merge modes.
 */

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Users,
  GitBranch,
  Replace,
  Plus,
  Download,
} from 'lucide-react';

interface GedcomImportProps {
  treeId: string;
  treeName: string;
  locale: 'ar' | 'en';
  onImportComplete?: () => void;
}

interface ImportResult {
  success: boolean;
  import_id?: string;
  persons_imported?: number;
  relationships_imported?: number;
  persons_found?: number;
  families_found?: number;
  errors?: string[];
  warnings?: string[];
}

const translations = {
  ar: {
    title: 'استيراد GEDCOM',
    description: 'استيراد بيانات شجرة العائلة من ملف GEDCOM (.ged)',
    dropzone: 'اسحب ملف GEDCOM هنا أو انقر للاختيار',
    dropzoneActive: 'أفلت الملف هنا',
    selectFile: 'اختيار ملف',
    selectedFile: 'الملف المحدد',
    fileSize: 'حجم الملف',
    mergeMode: 'طريقة الاستيراد',
    append: 'إضافة للشجرة',
    appendDesc: 'إضافة البيانات الجديدة مع الحفاظ على البيانات الحالية',
    replace: 'استبدال الشجرة',
    replaceDesc: 'حذف جميع البيانات الحالية واستبدالها بالملف',
    replaceWarning: 'تحذير: سيتم حذف جميع الأشخاص والعلاقات الحالية!',
    import: 'استيراد',
    importing: 'جاري الاستيراد...',
    cancel: 'إلغاء',
    success: 'تم الاستيراد بنجاح',
    personsImported: 'أشخاص تم استيرادهم',
    relationshipsImported: 'علاقات تم استيرادها',
    errors: 'أخطاء',
    warnings: 'تنبيهات',
    noErrors: 'لا توجد أخطاء',
    noWarnings: 'لا توجد تنبيهات',
    invalidFile: 'ملف غير صالح. يرجى اختيار ملف .ged أو .gedcom',
    fileTooLarge: 'حجم الملف كبير جدًا. الحد الأقصى 10 ميجابايت',
    importFailed: 'فشل الاستيراد',
    tryAgain: 'حاول مرة أخرى',
    done: 'تم',
    preview: 'معاينة',
    foundInFile: 'تم العثور في الملف',
    persons: 'أشخاص',
    families: 'عائلات',
  },
  en: {
    title: 'Import GEDCOM',
    description: 'Import family tree data from a GEDCOM file (.ged)',
    dropzone: 'Drag & drop a GEDCOM file here or click to select',
    dropzoneActive: 'Drop the file here',
    selectFile: 'Select File',
    selectedFile: 'Selected File',
    fileSize: 'File Size',
    mergeMode: 'Import Mode',
    append: 'Add to Tree',
    appendDesc: 'Add new data while keeping existing data',
    replace: 'Replace Tree',
    replaceDesc: 'Delete all existing data and replace with file',
    replaceWarning: 'Warning: All existing persons and relationships will be deleted!',
    import: 'Import',
    importing: 'Importing...',
    cancel: 'Cancel',
    success: 'Import Successful',
    personsImported: 'Persons imported',
    relationshipsImported: 'Relationships imported',
    errors: 'Errors',
    warnings: 'Warnings',
    noErrors: 'No errors',
    noWarnings: 'No warnings',
    invalidFile: 'Invalid file. Please select a .ged or .gedcom file',
    fileTooLarge: 'File too large. Maximum size is 10MB',
    importFailed: 'Import Failed',
    tryAgain: 'Try Again',
    done: 'Done',
    preview: 'Preview',
    foundInFile: 'Found in file',
    persons: 'persons',
    families: 'families',
  },
};

export default function GedcomImport({
  treeId,
  treeName,
  locale,
  onImportComplete,
}: GedcomImportProps) {
  const t = translations[locale];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mergeMode, setMergeMode] = useState<'append' | 'replace'>('append');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.ged') && !name.endsWith('.gedcom')) {
      return t.invalidFile;
    }
    if (file.size > 10 * 1024 * 1024) {
      return t.fileTooLarge;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(file);
    setError(null);
    setResult(null);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tree_id', treeId);
      formData.append('merge_mode', mergeMode);

      const response = await fetch('/api/gedcom/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          ...data.data,
        });
        onImportComplete?.();
      } else {
        setResult({
          success: false,
          errors: [data.error || t.importFailed],
        });
      }
    } catch (err) {
      setResult({
        success: false,
        errors: [t.importFailed],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setMergeMode('append');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show result screen
  if (result) {
    return (
      <div className="space-y-6">
        {/* Result Header */}
        <div className={`p-4 rounded-xl ${
          result.success
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
            <div>
              <h3 className={`font-bold ${
                result.success
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.success ? t.success : t.importFailed}
              </h3>
              {result.success && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {result.persons_imported} {t.personsImported}, {result.relationships_imported} {t.relationshipsImported}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {result.success && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
              <Users className="w-8 h-8 text-islamic-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {result.persons_imported}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {t.personsImported}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
              <GitBranch className="w-8 h-8 text-islamic-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {result.relationships_imported}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {t.relationshipsImported}
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {result.errors && result.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t.errors} ({result.errors.length})
            </h4>
            <ul className="space-y-1 text-sm text-red-600 dark:text-red-400 max-h-32 overflow-y-auto">
              {result.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t.warnings} ({result.warnings.length})
            </h4>
            <ul className="space-y-1 text-sm text-amber-600 dark:text-amber-400 max-h-32 overflow-y-auto">
              {result.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={resetForm}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {result.success ? t.done : t.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.description}</p>
      </div>

      {/* Dropzone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-islamic-primary bg-islamic-50 dark:bg-islamic-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".ged,.gedcom"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragging ? 'text-islamic-primary' : 'text-slate-400'
          }`} />
          <p className={`font-medium ${
            isDragging ? 'text-islamic-primary' : 'text-slate-700 dark:text-slate-300'
          }`}>
            {isDragging ? t.dropzoneActive : t.dropzone}
          </p>
          <p className="text-sm text-slate-500 mt-2">.ged, .gedcom</p>
        </div>
      ) : (
        /* Selected File */
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
              <FileText className="w-8 h-8 text-islamic-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 dark:text-white truncate">
                {file.name}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t.fileSize}: {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Merge Mode Selection */}
      {file && (
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
            {t.mergeMode}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setMergeMode('append')}
              className={`p-4 rounded-xl border text-start transition-all ${
                mergeMode === 'append'
                  ? 'border-islamic-primary bg-islamic-50 dark:bg-islamic-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Plus className={`w-5 h-5 ${
                  mergeMode === 'append' ? 'text-islamic-primary' : 'text-slate-400'
                }`} />
                <span className="font-medium text-slate-900 dark:text-white">{t.append}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.appendDesc}</p>
            </button>

            <button
              onClick={() => setMergeMode('replace')}
              className={`p-4 rounded-xl border text-start transition-all ${
                mergeMode === 'replace'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Replace className={`w-5 h-5 ${
                  mergeMode === 'replace' ? 'text-red-500' : 'text-slate-400'
                }`} />
                <span className="font-medium text-slate-900 dark:text-white">{t.replace}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.replaceDesc}</p>
            </button>
          </div>

          {/* Replace Warning */}
          {mergeMode === 'replace' && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{t.replaceWarning}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      {file && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={resetForm}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-islamic-primary hover:bg-islamic-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.importing}
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {t.import}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
