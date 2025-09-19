import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Image, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Photo {
  id: string;
  url: string;
  name: string;
  timestamp: string;
  holeNumber?: number;
}

interface PhotoAttachmentProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  holeNumber?: number;
  maxPhotos?: number;
}

export const PhotoAttachment = ({ 
  photos, 
  onPhotosChange, 
  holeNumber,
  maxPhotos = 10 
}: PhotoAttachmentProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (photos.length + validFiles.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const newPhotos: Photo[] = validFiles.map(file => ({
      id: `photo-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      name: file.name,
      timestamp: new Date().toISOString(),
      holeNumber
    }));

    onPhotosChange([...photos, ...newPhotos]);
    toast.success(`Added ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}`);
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    onPhotosChange(updatedPhotos);
    toast.success('Photo removed');
  };

  const takePhoto = () => {
    cameraInputRef.current?.click();
  };

  const selectFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Photos {holeNumber && `(Hole ${holeNumber})`}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={takePhoto}
            disabled={photos.length >= maxPhotos}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectFiles}
            disabled={photos.length >= maxPhotos}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photo) => (
            <Card key={photo.id} className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          <Image className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{photo.name}</DialogTitle>
                        </DialogHeader>
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-auto max-h-[70vh] object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {photos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No photos yet</p>
          <p className="text-xs">Add photos to document your round</p>
        </div>
      )}
    </div>
  );
};