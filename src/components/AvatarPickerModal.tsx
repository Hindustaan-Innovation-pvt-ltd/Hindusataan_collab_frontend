import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';
import { toBlob } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../app/components/ui/dialog';
import { Button } from '../app/components/ui/button';
import { Dices, Search } from 'lucide-react';
import { toast } from 'sonner';

const STYLES = {
  Adventurer: collection.adventurer,
  'Adventurer Neutral': collection.adventurerNeutral,
  Avataaars: collection.avataaars,
  'Big Smile': collection.bigSmile,
  Bottts: collection.bottts,
  Croodles: collection.croodles,
  'Fun Emoji': collection.funEmoji,
  Icons: collection.icons,
  Identicon: collection.identicon,
  Initials: collection.initials,
  Lorelei: collection.lorelei,
  Micah: collection.micah,
  Miniavs: collection.miniavs,
  Notionists: collection.notionists,
  'Open Peeps': collection.openPeeps,
  Personas: collection.personas,
  'Pixel Art': collection.pixelArt,
  'Pixel Art Neutral': collection.pixelArtNeutral,
  Shapes: collection.shapes,
  Thumbs: collection.thumbs
};

type StyleName = keyof typeof STYLES;

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarComplete: (croppedBlob: Blob) => Promise<void>;
  defaultName?: string;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  onAvatarComplete,
  defaultName = 'User',
}: AvatarPickerModalProps) {
  const [styleName, setStyleName] = useState<StyleName>('Avataaars');
  const [seed, setSeed] = useState(defaultName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gridSeeds, setGridSeeds] = useState<string[]>([]);
  
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const cachedStyle = localStorage.getItem('avatarPickerStyle') as StyleName;
      const cachedSeed = localStorage.getItem('avatarPickerSeed');
      if (cachedStyle && STYLES[cachedStyle]) {
        setStyleName(cachedStyle);
      }
      if (cachedSeed) {
        setSeed(cachedSeed);
      } else {
        setSeed(defaultName);
      }
    }
  }, [isOpen, defaultName]);

  const generateGridSeeds = useCallback(() => {
    const newSeeds = Array.from({ length: 24 }, () => Math.random().toString(36).substring(2, 10));
    setGridSeeds(newSeeds);
  }, []);

  useEffect(() => {
    generateGridSeeds();
  }, [styleName, generateGridSeeds]);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('avatarPickerStyle', styleName);
      localStorage.setItem('avatarPickerSeed', seed);
    }
  }, [styleName, seed, isOpen]);

  const handleRandomize = () => {
    const newSeed = Math.random().toString(36).substring(2, 10);
    setSeed(newSeed);
    generateGridSeeds();
  };

  const handleApply = useCallback(async () => {
    if (!avatarRef.current) return;
    
    setIsProcessing(true);
    try {
      const blob = await toBlob(avatarRef.current, {
        cacheBust: true,
        width: 400,
        height: 400,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          borderRadius: '50%',
          margin: '0',
          padding: '0'
        }
      });
      
      if (!blob) throw new Error('Failed to generate avatar image');
      
      await onAvatarComplete(blob);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate avatar.');
    } finally {
      setIsProcessing(false);
    }
  }, [onAvatarComplete, onClose]);

  const selectedAvatarDataUri = useMemo(() => {
    const avatar = createAvatar(STYLES[styleName] as any, {
      seed: seed,
      size: 192,
      backgroundColor: ['b6e3f4','c0aede','d1d4f9','ffd5dc','ffdfbf']
    });
    return avatar.toDataUri();
  }, [styleName, seed]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col bg-card border-border overflow-hidden">
        <DialogHeader className="shrink-0 pb-2 border-b border-border">
          <DialogTitle className="text-xl font-bold text-foreground">Choose an Avatar</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a style and pick from the generated options, or type any name to create a custom one!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden py-4 min-h-0">
          <div className="flex flex-col items-center gap-6 shrink-0 md:w-[280px]">
            <div 
              ref={avatarRef}
              className="w-48 h-48 rounded-full overflow-hidden border-4 border-background shadow-xl flex items-center justify-center bg-transparent"
            >
              <img 
                src={selectedAvatarDataUri} 
                alt="Selected Avatar" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search / Seed</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={14} className="text-muted-foreground" />
                    </div>
                    <input 
                      type="text" 
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Type a name..."
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleRandomize}
                    className="border-border hover:bg-muted text-foreground px-3 shrink-0 h-[38px]"
                    title="Randomize Avatar"
                  >
                    <Dices size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Style</label>
                <select
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value as StyleName)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground cursor-pointer font-medium"
                >
                  {Object.keys(STYLES).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/20 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Or pick from these variations:</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {gridSeeds.map((s) => {
                const avatarUri = createAvatar(STYLES[styleName] as any, { 
                  seed: s, 
                  size: 64,
                  backgroundColor: ['b6e3f4','c0aede','d1d4f9','ffd5dc','ffdfbf']
                }).toDataUri();
                
                return (
                  <button
                    key={s}
                    onClick={() => setSeed(s)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-md flex items-center justify-center ${
                      seed === s ? 'border-indigo-500 shadow-sm ring-2 ring-indigo-500/20 bg-indigo-50/50' : 'border-transparent hover:border-indigo-300 bg-background'
                    }`}
                  >
                    <img src={avatarUri} alt={`Avatar ${s}`} className="w-full h-full p-1" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            className="border-border text-foreground hover:bg-muted font-medium"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
          >
            {isProcessing ? 'Saving...' : 'Apply & Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
