import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../app/components/ui/dialog';
import { Button } from '../app/components/ui/button';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';
import getCroppedImg from '../utils/cropImage';
import { toast } from 'sonner';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => Promise<void>;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      
      if (!croppedImage) {
        throw new Error('Failed to crop image');
      }
      
      await onCropComplete(croppedImage);
      onClose(); // Close modal upon success
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModifications = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">Edit Profile Picture</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Drag to reposition, use the slider to zoom, or rotate.
          </DialogDescription>
        </DialogHeader>

        {/* Cropper Container */}
        <div className="relative w-full h-[300px] bg-black/10 dark:bg-black/50">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1} // Square crop
              cropShape="round" // Circular preview
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 space-y-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut size={18} className="text-muted-foreground" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <ZoomIn size={18} className="text-muted-foreground" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border text-foreground hover:bg-muted"
                onClick={() => setRotation((prev) => prev - 90)}
                title="Rotate Left"
                aria-label="Rotate image left by 90 degrees"
                disabled={isProcessing}
              >
                <RotateCcw size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border text-foreground hover:bg-muted"
                onClick={() => setRotation((prev) => prev + 90)}
                title="Rotate Right"
                aria-label="Rotate image right by 90 degrees"
                disabled={isProcessing}
              >
                <RotateCw size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={resetModifications}
                title="Reset"
                aria-label="Reset zoom and rotation"
                disabled={isProcessing}
              >
                <RefreshCcw size={16} />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isProcessing}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isProcessing ? 'Saving...' : 'Apply & Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
