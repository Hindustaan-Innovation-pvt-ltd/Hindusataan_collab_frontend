import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Choose your plan</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          
          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-full flex items-center gap-1">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Yearly <span className="text-xs text-green-500 font-bold ml-1">-20%</span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Free Plan */}
            <div className="border border-border rounded-xl p-5 flex flex-col bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm">
              <h3 className="text-lg font-bold mb-1 text-slate-800">Free</h3>
              <div className="text-2xl font-bold mb-6 text-slate-900">₹0<span className="text-sm font-medium text-slate-500">/month</span></div>
              
              <ul className="flex-1 space-y-3 mb-6">
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Current Plan</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Limited boards</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Basic drawing tools</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Limited AI usage</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Export PNG</span></li>
              </ul>

              <button className="w-full py-2 px-4 rounded-lg bg-slate-200/50 text-slate-400 font-medium text-sm cursor-not-allowed">
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-primary rounded-xl p-5 flex flex-col relative bg-white shadow-xl shadow-primary/10 transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Recommended
              </div>
              <h3 className="text-lg font-bold mb-1 text-slate-800">Pro</h3>
              <div className="text-2xl font-bold mb-6 text-slate-900">
                {billingCycle === 'monthly' ? '₹499' : '₹399'}
                <span className="text-sm font-medium text-slate-500">/month</span>
              </div>
              
              <ul className="flex-1 space-y-3 mb-6">
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm font-medium text-slate-700">Unlimited Boards</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm font-medium text-slate-700">Unlimited AI</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">PDF Export</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Team Collaboration</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Version History</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-primary mt-0.5" /><span className="text-sm text-slate-600">Priority Support</span></li>
              </ul>

              <button className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm">
                Upgrade to Pro
              </button>
            </div>

            {/* Business Plan */}
            <div className="border border-border rounded-xl p-5 flex flex-col bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm">
              <h3 className="text-lg font-bold mb-1 text-slate-800">Business</h3>
              <div className="text-2xl font-bold mb-6 text-slate-900">Custom<span className="text-sm font-medium text-slate-500"> Pricing</span></div>
              
              <ul className="flex-1 space-y-3 mb-6">
                <li className="flex items-start gap-2.5"><Check size={16} className="text-slate-700 mt-0.5" /><span className="text-sm font-medium text-slate-700">Everything in Pro</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-slate-400 mt-0.5" /><span className="text-sm text-slate-600">Team Management</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-slate-400 mt-0.5" /><span className="text-sm text-slate-600">Admin Dashboard</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-slate-400 mt-0.5" /><span className="text-sm text-slate-600">Analytics</span></li>
                <li className="flex items-start gap-2.5"><Check size={16} className="text-slate-400 mt-0.5" /><span className="text-sm text-slate-600">API Access</span></li>
              </ul>

              <button className="w-full py-2 px-4 rounded-lg bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition-colors shadow-sm">
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
