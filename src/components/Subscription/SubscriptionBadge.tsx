import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';

export const SubscriptionBadge: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 bg-card hover:bg-muted rounded-xl px-3 h-10 border border-border shadow-lg cursor-pointer transition-colors pointer-events-auto"
      >
        <span className="text-sm font-bold text-foreground">Free</span>
        <ChevronDown size={16} className="text-muted-foreground" />
      </div>

      <SubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
