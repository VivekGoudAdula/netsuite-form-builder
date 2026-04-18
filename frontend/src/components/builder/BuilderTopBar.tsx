import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { TransactionType } from '../../types';
import { Button, Input, Select } from '../ui/Base';
import { Modal } from '../ui/Complex';
import { Save, Eye, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BuilderTopBar() {
  const { currentForm, updateForm, isLoading, catalogues, companies } = useStore();
  const navigate = useNavigate();
  const [showSavedToast, setShowSavedToast] = React.useState(false);
  const [showTypeConfirm, setShowTypeConfirm] = React.useState<TransactionType | null>(null);
  const [isModified, setIsModified] = React.useState(false);
  const updateCurrentForm = useStore((state) => (state as any).updateCurrentForm); // For local UI updates before save

  if (!currentForm) return null;

  const handleSave = async () => {
    if (!currentForm) return;

    // Validation: At least one field group
    const hasFieldGroup = currentForm.tabs.some(t => t.fieldGroups.length > 0);
    if (!hasFieldGroup) {
      alert('Validation Error: Form must contain at least one field group before synchronization.');
      return;
    }

    // Validation: Required fields must be visible
    const hiddenMandatoryFields: string[] = [];
    currentForm.tabs.forEach(t => {
      t.fieldGroups.forEach(g => {
        g.fields.forEach(f => {
          if (f.mandatory && (!f.visible || f.displayType === 'hidden')) {
            hiddenMandatoryFields.push(f.label);
          }
        });
      });
    });

    if (hiddenMandatoryFields.length > 0) {
      alert(`Validation Error: The following mandatory fields must be visible: ${hiddenMandatoryFields.join(', ')}`);
      return;
    }

    try {
      await updateForm(currentForm.id, {
        name: currentForm.name,
        tabs: currentForm.tabs
      });
      setShowSavedToast(true);
      setIsModified(false);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    if (currentForm.tabs.some(t => t.fieldGroups.some(g => g.fields.length > 0))) {
      setShowTypeConfirm(newType);
    } else {
      applyTypeChange(newType);
    }
  };

  const applyTypeChange = (newType: TransactionType) => {
    const catalogue = catalogues[newType];
    updateCurrentForm({ 
      transactionType: newType,
      name: `New ${catalogue.name}`,
      tabs: [{ id: 't1', name: 'Main', fieldGroups: [] }]
    });
    setShowTypeConfirm(null);
    setIsModified(true);
  };

  const company = companies.find(c => c.id === currentForm.customerId);

  return (
    <div className="bg-ns-navy text-white px-4 py-2.5 flex justify-between items-center shadow-lg z-20">
      <div className="flex items-center gap-5">
        <button 
          onClick={() => {
            if (isModified) {
              if (window.confirm('You have unsaved changes. Leave anyway?')) navigate('/dashboard');
            } else {
              navigate('/dashboard');
            }
          }} 
          className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={18} />
          Exit
        </button>
        <div className="h-6 w-[1px] bg-white/10" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-[0.2em]">Configuration Context</span>
            {currentForm.source === 'template' && (
              <span className="text-[8px] bg-green-600/80 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Template Source</span>
            )}
            {isModified && (
              <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse uppercase tracking-tighter ml-1">Unsaved Changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-ns-blue/20 text-ns-blue px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider border border-ns-blue/30">
                {catalogues[currentForm.transactionType].name}
              </span>
              <select 
                className="bg-transparent border-none focus:ring-0 text-[13px] font-bold p-0 cursor-pointer text-white/40 hover:text-white transition-colors w-4"
                value={currentForm.transactionType}
                onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
              >
                <option value="purchase_order" className="text-ns-text">Purchase Order</option>
                <option value="sales_order" className="text-ns-text">Sales Order</option>
                <option value="accounts_payable" className="text-ns-text">Accounts Payable</option>
                <option value="accounts_receivable" className="text-ns-text">Accounts Receivable</option>
              </select>
            </div>
            <div className="h-3 w-[1px] bg-white/10 mx-1" />
            <input 
              className="bg-transparent border-none focus:ring-0 text-[15px] font-bold p-0 w-64 placeholder:text-white/20 text-white"
              value={currentForm.name}
              onChange={(e) => {
                updateCurrentForm({ name: e.target.value });
                setIsModified(true);
              }}
              placeholder="Enter form name..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-[0.2em] mb-0.5">Target Company</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <select 
              className="bg-transparent border-none focus:ring-0 text-xs p-0 cursor-pointer font-semibold text-white/90"
              value={currentForm.customerId}
              onChange={(e) => {
                updateCurrentForm({ customerId: e.target.value });
                setIsModified(true);
              }}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id} className="text-ns-text">{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate('/preview')}>
            <Eye size={14} />
            Preview
          </Button>
          <Button size="sm" className="gap-2 bg-ns-blue border-none hover:bg-ns-blue/80 px-6 shadow-lg shadow-ns-blue/20" onClick={handleSave}>
            <Save size={14} />
            Save Configuration
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ns-navy border border-white/10 text-white px-6 py-3 rounded shadow-2xl flex items-center gap-3 text-sm font-semibold z-50"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            Configuration successfully synchronized.
          </motion.div>
        )}

        {showTypeConfirm && (
          <Modal isOpen={true} title="Switch Transaction Type?" onClose={() => setShowTypeConfirm(null)}>
            <div className="space-y-4">
              <p className="text-sm text-ns-text-muted leading-relaxed">
                Swapping the transaction type will reset your current builder progress for this form. Are you sure you want to proceed?
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowTypeConfirm(null)}>Cancel</Button>
                <Button onClick={() => applyTypeChange(showTypeConfirm!)}>Confirm & Reset</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
