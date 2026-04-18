import * as React from 'react';
import { useStore } from '../../store/useStore';
import { Input, Checkbox } from '../ui/Base';
import { Search, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
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
        "flex items-center gap-2 p-1.5 hover:bg-[#f9f9f9] group border border-transparent rounded cursor-pointer select-none",
        isDragging && "opacity-50 border-[#607799] bg-[#607799]/5",
        isAdded && "text-gray-400"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
        <GripVertical size={14} />
      </div>
      <Checkbox 
        checked={isAdded} 
        onChange={onToggle}
        className="pointer-events-none" 
      />
      <span className="text-xs truncate flex-1">{field.label}</span>
    </div>
  );
};

export default function CataloguePanel() {
  const { catalogues, currentForm, toggleField } = useStore();
  const [search, setSearch] = React.useState('');
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['primary_information']);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  if (!currentForm) return null;

  const catalogue = catalogues[currentForm.transactionType];
  const filteredFields = catalogue.fields.filter(f => 
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  const addedFieldIds = new Set(
    currentForm.tabs.flatMap(t => t.fieldGroups.flatMap(g => g.fields.map(f => f.id))) || []
  );

  const groups = catalogue.fieldGroups.map(groupName => ({
    id: groupName.toLowerCase().replace(/ /g, '_'),
    name: groupName,
    fields: filteredFields.filter(f => f.fieldGroup === groupName)
  }));

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
      
      <div className="flex-1 overflow-auto py-2 grow">
        {groups.map(group => (
          <div key={group.id} className="mb-1">
            <button 
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold text-ns-text uppercase tracking-wider hover:bg-gray-50 transition-colors",
                expandedGroups.includes(group.id) && "bg-gray-50/50"
              )}
            >
              {expandedGroups.includes(group.id) ? <ChevronDown size={14} className="text-ns-blue" /> : <ChevronRight size={14} className="text-gray-400" />}
              {group.name}
            </button>
            
            {expandedGroups.includes(group.id) && (
              <div className="px-2 py-1 space-y-0.5">
                {group.fields.map(field => (
                  <DraggableField 
                    key={field.id} 
                    field={field} 
                    isAdded={addedFieldIds.has(field.id)} 
                    onToggle={() => toggleField(field)}
                  />
                ))}
                {group.fields.length === 0 && (
                  <div className="px-4 py-2 text-[10px] text-gray-400 italic">No fields match your search</div>
                )}
              </div>
            )}
          </div>
        ))}
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
