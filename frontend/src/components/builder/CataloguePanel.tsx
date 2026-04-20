import * as React from 'react';
import { useStore } from '../../store/useStore';
import { Input, Checkbox } from '../ui/Base';
import { Search, ChevronDown, ChevronRight, GripVertical, Check, MoreHorizontal } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

const DraggableField = ({ field, isAdded, onToggle, ...props }: { field: any; isAdded: boolean; onToggle: () => void; [key: string]: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: field
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-2 hover:bg-ns-gray-bg group border border-transparent rounded-sm cursor-pointer select-none transition-all",
        isDragging && "opacity-50 border-ns-blue bg-ns-blue/5 scale-95 shadow-lg",
        isAdded && "opacity-60 bg-gray-50"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-ns-blue transition-colors p-0.5">
        <MoreHorizontal size={14} className="rotate-90" />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold truncate text-ns-navy">{field.label}</span>
          {field.mandatory && <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" title="Required" />}
          {isAdded && <div className="ml-auto w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-sm"><Check size={8} className="text-white" strokeWidth={4} /></div>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono text-gray-400 truncate">{field.id}</span>
          {field.isSystemField ? (
            <span className="text-[8px] font-bold text-ns-blue bg-ns-blue/5 px-1 rounded-[2px] uppercase">Sys</span>
          ) : (
            <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 rounded-[2px] uppercase">Cust</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CataloguePanel() {
  const { catalogues, currentForm, toggleField } = useStore();
  const [search, setSearch] = React.useState('');
  if (!currentForm) return null;

  const catalogue = catalogues[currentForm.transactionType];
  const filteredFields = catalogue.fields.filter(f => 
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  const addedFieldIds = new Set(
    currentForm.tabs.flatMap(t => t.fieldGroups.flatMap(g => g.fields.map(f => f.id))) || []
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-ns-border">
      <div className="p-4 border-b border-ns-border bg-gray-50/50">
        <h2 className="text-[11px] font-bold text-ns-text uppercase tracking-[0.15em] mb-3">Field Catalogue</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
          <Input 
            placeholder="Search fields..." 
            className="pl-8 h-9 text-xs bg-white border-ns-border focus:ring-ns-blue/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2 grow custom-scrollbar">
        <div className="px-2 space-y-0.5">
          {filteredFields.map(field => (
            <DraggableField 
              key={field.id} 
              field={field} 
              isAdded={addedFieldIds.has(field.id)} 
              onToggle={() => toggleField(field)}
            />
          ))}
          {filteredFields.length === 0 && (
            <div className="px-4 py-8 text-center bg-gray-50/50 border border-dashed rounded-sm border-gray-200 m-2">
              <span className="text-[10px] text-gray-400 italic font-medium uppercase tracking-widest">No matching fields found</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-ns-border bg-gray-50/30">
        <div className="flex items-center gap-2 text-[10px] text-ns-text-muted font-medium">
          <div className="w-2 h-2 rounded-full bg-ns-blue" />
          <span>{addedFieldIds.size} / {catalogue.fields.length} Fields Used</span>
        </div>
      </div>
    </div>
  );
}
