import { useState, useRef, useCallback } from 'react';
import { Upload, X, Link, Loader2, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function ImageUpload({ value, onChange, className = '' }: ImageUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setStatus('error');
      setErrorMessage('Only JPEG, PNG, GIF, WebP, and SVG files are allowed.');
      return;
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('File size must be under 10 MB.');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(data.message || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      onChange(data.url);
      setStatus('success');

      // Reset success status after 3s
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [onChange]);

  // ── Drag & Drop handlers ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }, [uploadFile]);

  const handleUrlSubmit = useCallback(() => {
    const url = urlInputValue.trim();
    if (!url) return;
    // Basic URL validation
    try {
      new URL(url);
      onChange(url);
      setUrlInputValue('');
      setShowUrlInput(false);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setErrorMessage('Please enter a valid URL');
    }
  }, [urlInputValue, onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    setStatus('idle');
    setErrorMessage('');
  }, [onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview */}
      {value && (
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={value}
            alt="Featured image preview"
            className="w-full h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).alt = 'Failed to load image';
              (e.target as HTMLImageElement).className = 'w-full h-48 bg-gray-100 flex items-center justify-center';
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-gray-800"
            >
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1 px-1 truncate">
            {value}
          </p>
        </div>
      )}

      {/* Drop Zone (shown when no image) */}
      {!value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-forest-green bg-forest-green/5 scale-[1.01]'
              : 'border-gray-300 hover:border-forest-green/50 hover:bg-gray-50'
            }
            ${status === 'uploading' ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          {status === 'uploading' ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-8 w-8 text-forest-green animate-spin" />
              <p className="text-sm text-gray-600">Uploading to Cloudinary...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Drop image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-xs text-gray-500">or click to browse</p>
              <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP, SVG — max 10 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL paste fallback */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          <Link className="h-3 w-3 mr-1" />
          {showUrlInput ? 'Hide URL input' : 'Paste image URL instead'}
        </Button>

        {status === 'success' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" /> Image set
          </span>
        )}
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="text-sm"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInputValue.trim()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
