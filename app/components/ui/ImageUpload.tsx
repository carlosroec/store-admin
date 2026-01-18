import { useState, useCallback, useRef } from "react";
import { getOptimizedImageUrl } from "~/lib/cloudinary";

interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
}

// Extract public ID from Cloudinary URL
function extractPublicId(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/v123456789/folder/filename.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  folder = "products"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = useCallback(async (file: File): Promise<UploadedImage | null> => {
    try {
      // Get signature from our API
      const signatureResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder })
      });

      if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, timestamp, apiKey, cloudName } = await signatureResponse.json();

      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await uploadResponse.json();
      return {
        url: data.secure_url,
        publicId: data.public_id
      };
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  }, [folder]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    const validFiles = filesToUpload.filter(file => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = validFiles.map(file => uploadToCloudinary(file));
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is UploadedImage => r !== null);
      const newUrls = successfulUploads.map(r => r.url);

      onChange([...images, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onChange, uploadToCloudinary]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback(async (index: number) => {
    const imageUrl = images[index];

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    setDeleting(index);
    setError(null);

    try {
      // Extract public ID from URL and delete from Cloudinary
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        const response = await fetch("/api/cloudinary-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete image");
        }
      }

      // Remove from local state
      onChange(images.filter((_, i) => i !== index));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeleting(null);
    }
  }, [images, onChange]);

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onChange(newImages);
  }, [images, onChange]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Images ({images.length}/{maxImages})
      </label>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, index) => {
            const isDeleting = deleting === index;
            return (
              <div
                key={url}
                className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden ${isDeleting ? 'opacity-50' : ''}`}
              >
                <img
                  src={getOptimizedImageUrl(url, { width: 200, height: 200, crop: 'fill' })}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Deleting overlay */}
                {isDeleting && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}

                {/* Overlay with actions */}
                {!isDeleting && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      {/* Move left */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                          className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="Move left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      )}

                      {/* Move right */}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveImage(index, index + 1); }}
                          className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="Move right"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary badge */}
                {index === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                    Primary
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="images" value={images.join('\n')} />
    </div>
  );
}
