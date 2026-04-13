'use client';
import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon, GripVertical } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';

interface ImageUploaderProps {
  coverImage: string | null;
  detailImages: string[];
  onCoverChange: (url: string | null) => void;
  onDetailImagesChange: (urls: string[]) => void;
  maxDetailImages?: number;
}

export default function ImageUploader({
  coverImage,
  detailImages,
  onCoverChange,
  onDetailImagesChange,
  maxDetailImages = 10,
}: ImageUploaderProps) {
  const [coverUploading, setCoverUploading] = useState(false);
  const [detailUploading, setDetailUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    setCoverUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      onCoverChange(result.secure_url);
      toast.success('Upload ảnh bìa thành công!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload ảnh bìa thất bại');
    } finally {
      setCoverUploading(false);
    }
  }, [onCoverChange]);

  const handleDetailUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxDetailImages - detailImages.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${maxDetailImages} ảnh chi tiết`);
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    setDetailUploading(true);
    try {
      const results = await Promise.all(
        filesToUpload.map(async (file) => {
          if (!file.type.startsWith('image/')) return null;
          const result = await uploadToCloudinary(file);
          return result.secure_url;
        })
      );
      const newUrls = results.filter((u): u is string => u !== null);
      onDetailImagesChange([...detailImages, ...newUrls]);
      toast.success(`Upload ${newUrls.length} ảnh thành công!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload ảnh thất bại');
    } finally {
      setDetailUploading(false);
    }
  }, [detailImages, maxDetailImages, onDetailImagesChange]);

  const removeCover = () => onCoverChange(null);
  const removeDetail = (index: number) => {
    onDetailImagesChange(detailImages.filter((_, i) => i !== index));
  };

  const moveDetail = (from: number, to: number) => {
    if (to < 0 || to >= detailImages.length) return;
    const arr = [...detailImages];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onDetailImagesChange(arr);
  };

  return (
    <div className="space-y-5">
      {/* Cover Image */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Ảnh bìa <span className="text-muted-foreground font-normal">(hiển thị ở danh sách)</span>
        </label>
        {coverImage ? (
          <div className="relative group w-full max-w-xs">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full aspect-video object-cover rounded-lg border border-border/50"
            />
            <button
              type="button"
              onClick={removeCover}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => coverInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); handleCoverUpload(e.dataTransfer.files); }}
            className="w-full max-w-xs aspect-video border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
          >
            {coverUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Đang upload...</span>
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Kéo thả hoặc click để chọn ảnh bìa</span>
              </>
            )}
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleCoverUpload(e.target.files)}
        />
      </div>

      {/* Detail Images */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Ảnh chi tiết <span className="text-muted-foreground font-normal">(tối đa {maxDetailImages} ảnh)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {/* Existing images */}
          {detailImages.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`Detail ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border/50"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg" />
              <button
                type="button"
                onClick={() => removeDetail(i)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {i > 0 && (
                  <button type="button" onClick={() => moveDetail(i, i - 1)} className="bg-black/70 text-white rounded px-1 py-0.5 text-[10px]">◀</button>
                )}
                {i < detailImages.length - 1 && (
                  <button type="button" onClick={() => moveDetail(i, i + 1)} className="bg-black/70 text-white rounded px-1 py-0.5 text-[10px]">▶</button>
                )}
              </div>
              <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1 rounded">{i + 1}</span>
            </div>
          ))}

          {/* Upload placeholder */}
          {detailImages.length < maxDetailImages && (
            <div
              onClick={() => detailInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); handleDetailUpload(e.dataTransfer.files); }}
              className="aspect-square border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors"
            >
              {detailUploading ? (
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground text-center px-1">Thêm ảnh</span>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={detailInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleDetailUpload(e.target.files)}
        />
      </div>
    </div>
  );
}
