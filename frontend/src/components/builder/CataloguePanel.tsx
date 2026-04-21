import * as React from 'react';
import { useStore } from '../../store/useStore';
import { Input } from '../ui/Base';
import { Search, ChevronDown, ChevronRight, Check, MoreHorizontal, Package, CreditCard, Ship, FileText, Settings } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

const DraggableField = ({ field, isAdded, onToggle }: { field: any; isAdded: boolean; onToggle: () => void }) => {
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
        "flex items-center gap-2 px-3 py-1.5 hover:bg-ns-gray-bg group border border-transparent rounded-sm cursor-pointer select-none transition-all",
        isDragging && "opacity-50 border-ns-blue bg-ns-blue/5 scale-95 shadow-lg z-[100]",
        isAdded && "opacity-60 bg-gray-50"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-ns-blue transition-colors p-0.5">
        <MoreHorizontal size={14} className="rotate-90" />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold truncate text-ns-navy">{field.label}</span>
          {field.mandatory && <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />}
          {isAdded && <Check size={10} className="text-green-500 ml-auto shrink-0" strokeWidth={4} />}
        </div>
      </div>
    </div>
  );
};

const TabFolder = ({ tab, search, addedFieldIds, toggleField }: any) => {
  const [isOpen, setIsOpen] = React.useState(tab.name === 'Main');
  
  // Filter groups and subSections based on search
  const filteredGroups = tab.groups.map((group: any) => ({
    ...group,
    fields: group.fields.filter((f: any) => f.label.toLowerCase().includes(search.toLowerCase()))
  })).filter((g: any) => g.fields.length > 0);

  const filteredSubSections = Object.fromEntries(
    Object.entries(tab.subSections).map(([key, fields]: [string, any]) => [
      key, 
      fields.filter((f: any) => f.label.toLowerCase().includes(search.toLowerCase()))
    ]).filter(([_, fields]) => fields.length > 0)
  );

  const hasResults = filteredGroups.length > 0 || Object.keys(filteredSubSections).length > 0;
  if (search && !hasResults) return null;

  const TabIcon = () => {
    switch(tab.name) {
      case 'Main': return <FileText size={14} />;
      case 'Items': return <Package size={14} />;
      case 'Shipping': return <Ship size={14} />;
      case 'Billing': return <CreditCard size={14} />;
      default: return <Settings size={14} />;
    }
  };

  return (
    <div className="border-b border-ns-border last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="text-ns-blue"><TabIcon /></div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ns-navy flex-1 text-left">{tab.name}</span>
        {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="bg-ns-gray-bg/30 pb-2">
          {/* Render Groups */}
          {filteredGroups.map((group: any) => (
            <div key={group.name} className="mt-2 px-2">
              <div className="px-2 py-1 text-[9px] font-bold text-ns-text-muted uppercase tracking-widest">{group.name}</div>
              <div className="space-y-0.5">
                {group.fields.map((field: any) => (
                  <React.Fragment key={field.id}>
                    <DraggableField
                      field={field}
                      isAdded={addedFieldIds.has(field.id)}
                      onToggle={() => toggleField(field)}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}

          {/* Render Subsections (Items/Expenses) */}
          {Object.entries(filteredSubSections).map(([subName, fields]: [string, any]) => (
            <div key={subName} className="mt-2 px-2">
              <div className="px-2 py-1 text-[9px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 rounded-sm mb-1">{subName}</div>
              <div className="space-y-0.5">
                {fields.map((field: any) => (
                  <React.Fragment key={field.id}>
                    <DraggableField
                      field={field}
                      isAdded={addedFieldIds.has(field.id)}
                      onToggle={() => toggleField(field)}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CataloguePanel() {
  const { groupedCatalogues, fetchGroupedCatalogue, currentForm, toggleField, addAllFields } = useStore();
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (currentForm) {
      fetchGroupedCatalogue(currentForm.transactionType);
    }
  }, [currentForm?.transactionType]);

  if (!currentForm) return null;

  const groupedCatalogue = groupedCatalogues[currentForm.transactionType];
  
  const addedFieldIds = new Set(
    currentForm.tabs.flatMap(t => [
      ...(t.fieldGroups?.flatMap(g => g.fields.map(f => f.id)) || []),
      ...(t.itemSublist?.map(f => f.id) || []),
      ...(t.expenseSublist?.map(f => f.id) || [])
    ])
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-ns-border">
      <div className="p-4 border-b border-ns-border bg-gray-50/50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-bold text-ns-text uppercase tracking-[0.15em]">Field Catalogue</h2>
          <button 
            onClick={() => addAllFields()}
            className="text-[10px] font-bold text-ns-blue hover:text-ns-navy transition-colors flex items-center gap-1"
          >
            <Check size={12} strokeWidth={3} />
            Apply All
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
          <Input 
            placeholder="Search within tabs..." 
            className="pl-8 h-9 text-xs bg-white border-ns-border focus:ring-ns-blue/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto grow custom-scrollbar">
        {!groupedCatalogue ? (
          <div className="p-10 text-center animate-pulse">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading Hierarchy...</span>
          </div>
        ) : (
          <div>
            {groupedCatalogue.tabs.map(tab => (
              <TabFolder 
                key={tab.name} 
                tab={tab} 
                search={search} 
                addedFieldIds={addedFieldIds} 
                toggleField={toggleField} 
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-ns-border bg-gray-50/30">
        <div className="flex items-center gap-2 text-[10px] text-ns-text-muted font-medium">
          <div className="w-2 h-2 rounded-full bg-ns-blue" />
          <span>{addedFieldIds.size} Fields Added</span>
        </div>
      </div>
    </div>
  );
}
