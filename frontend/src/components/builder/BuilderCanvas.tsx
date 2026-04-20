import * as React from 'react';
import { useStore } from '../../store/useStore';
import { Tabs } from '../ui/Complex';
import { Button, Input } from '../ui/Base';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { FieldGroup, Tab } from '../../types';

const DroppableGroup = ({ group, onRemoveField, onSelectField, selectedFieldId, onUpdateGroup, onDeleteGroup, onMoveGroup, hideHeader }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.id}`,
  });

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState(group.name);

  const handleNameSave = () => {
    onUpdateGroup(group.id, { name: editedName });
    setIsEditingName(false);
  };

  if (hideHeader) {
    return (
      <div 
        ref={setNodeRef}
        className={cn(
          "bg-white border-2 border-dashed rounded-lg min-h-[400px] transition-all duration-200 p-8",
          isOver ? "border-ns-blue bg-ns-blue/[0.02] ring-4 ring-ns-blue/5" : "border-ns-border"
        )}
      >
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          {group.fields.map((field: any) => (
            <div 
              key={field.id}
              onClick={(e) => { e.stopPropagation(); onSelectField(field.id); }}
              className={cn(
                "flex items-center gap-4 p-3 border rounded-sm group cursor-pointer transition-all relative select-none",
                selectedFieldId === field.id 
                  ? "border-ns-blue bg-ns-blue/[0.03] ring-1 ring-ns-blue/30" 
                  : "border-transparent hover:border-ns-border hover:bg-gray-50/50"
              )}
            >
              <div className="text-ns-blue/40 transition-colors shrink-0">
                <GripVertical size={14} />
              </div>
              <div className="flex-1 overflow-hidden">
                <label className={cn(
                  "text-[10px] font-bold uppercase tracking-wider mb-1.5 block transition-colors truncate",
                  selectedFieldId === field.id ? "text-ns-blue" : "text-ns-text-muted"
                )}>
                  {field.label} {field.mandatory && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <div className={cn(
                  "h-8 border border-ns-border rounded-sm px-3 flex items-center text-[10px] font-medium transition-all shadow-inner truncate",
                  field.displayType === 'disabled' ? "bg-gray-100 italic text-gray-400" : "bg-white text-gray-400"
                )}>
                  {field.type === 'RecordRef' || field.type === 'select' ? 'Select Option...' : 'Text Input...'}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
                className="absolute -top-2 -right-2 bg-white border border-ns-border rounded-full p-1 text-gray-400 hover:text-red-500 shadow-sm transition-all z-10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {group.fields.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-300">
              <Plus size={40} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Initialization Complete</p>
              <p className="text-[10px] mt-1 italic">Click or drag fields from the catalogue to begin.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "bg-white border rounded-sm mb-8 transition-all duration-200 ns-panel-shadow",
        isOver ? "border-ns-blue bg-ns-blue/[0.02] ring-4 ring-ns-blue/5 scale-[1.005]" : "border-ns-border"
      )}
    >
      <div className="px-5 py-3 border-b border-ns-border flex justify-between items-center ns-header-gradient">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-gray-400 cursor-grab shrink-0">
            <GripVertical size={14} />
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <Input 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)} 
                className="h-7 text-[11px] py-1 px-2 w-48 font-bold uppercase tracking-wider" 
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleNameSave}><Plus size={14}/></Button>
            </div>
          ) : (
            <h3 
              className="text-[11px] font-bold text-ns-text uppercase tracking-[0.15em] cursor-pointer hover:text-ns-blue transition-colors truncate"
              onClick={() => setIsEditingName(true)}
            >
              {group.name}
            </h3>
          )}
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:bg-gray-200" 
            onClick={() => onMoveGroup(group.id, 'up')}
            title="Move Group Up"
          >
            <ChevronUp size={14}/>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:bg-gray-200" 
            onClick={() => onMoveGroup(group.id, 'down')}
            title="Move Group Down"
          >
            <ChevronDown size={14}/>
          </Button>
          <div className="w-[1px] h-4 bg-ns-border mx-1 my-auto" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-red-400 hover:bg-red-50"
            onClick={() => onDeleteGroup(group.id)}
            title="Delete Group"
          >
            <Trash2 size={14}/>
          </Button>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6 min-h-[120px]">
        {group.fields.map((field: any) => (
          <div 
            key={field.id}
            onClick={(e) => { e.stopPropagation(); onSelectField(field.id); }}
            className={cn(
              "flex items-center gap-4 p-3 border rounded-sm group cursor-pointer transition-all relative select-none",
              selectedFieldId === field.id 
                ? "border-ns-blue bg-ns-blue/[0.03] ring-1 ring-ns-blue/30" 
                : "border-transparent hover:border-ns-border hover:bg-gray-50/50"
            )}
          >
            <div className="text-ns-blue/40 transition-colors shrink-0">
              <GripVertical size={14} />
            </div>
            <div className="flex-1 overflow-hidden">
              <label className={cn(
                "text-[10px] font-bold uppercase tracking-wider mb-1.5 block transition-colors truncate",
                selectedFieldId === field.id ? "text-ns-blue" : "text-ns-text-muted"
              )}>
                {field.label} {field.mandatory && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <div className={cn(
                "h-8 border border-ns-border rounded-sm px-3 flex items-center text-[10px] font-medium transition-all shadow-inner truncate",
                field.displayType === 'disabled' ? "bg-gray-100 italic text-gray-400" : "bg-white text-gray-400",
                field.displayType === 'hidden' ? "opacity-30 border-dashed" : "opacity-100"
              )}>
                {field.type === 'RecordRef' || field.type === 'select' 
                  ? 'Record Reference...' 
                  : field.type === 'dateTime' 
                    ? 'YYYY-MM-DD' 
                    : (field.type === 'boolean' || field.type === 'checkbox')
                      ? `[${field.checkBoxDefault.toUpperCase()}] Checkbox`
                      : 'Text Input...'}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
              className="absolute -top-2 -right-2 bg-white border border-ns-border rounded-full p-1 text-gray-400 hover:text-red-500 shadow-sm transition-all z-10"
              title="Remove Field"
            >
              <Trash2 size={12} />
            </button>

            {/* Field Position Actions Component could go here, but I'll add simple up/down to Properties Panel instead for space */}
          </div>
        ))}
        {group.fields.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-sm py-10 text-gray-400 bg-gray-50/30">
            <Plus size={24} className="mb-2 opacity-20" />
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Drop fields here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function BuilderCanvas({ activeTabId, setActiveTabId, selectedFieldId, setSelectedFieldId }: any) {
  const { currentForm, updateCurrentForm } = useStore();

  if (!currentForm) return null;

  const activeTab = currentForm.tabs.find(t => t.id === activeTabId);

  const handleRemoveField = (fieldId: string) => {
    const newTabs = currentForm.tabs.map(tab => ({
      ...tab,
      fieldGroups: tab.fieldGroups.map(group => ({
        ...group,
        fields: group.fields.filter(f => f.id !== fieldId)
      }))
    }));
    updateCurrentForm({ tabs: newTabs });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleAddGroup = () => {
    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Field Group',
      fields: []
    };
    
    let newTabs = [...currentForm.tabs];
    
    // If no tabs exist, create a default one first
    if (newTabs.length === 0) {
      const newTab: Tab = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'General',
        fieldGroups: [newGroup]
      };
      updateCurrentForm({ tabs: [newTab] });
      setActiveTabId(newTab.id);
      return;
    }

    newTabs = newTabs.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, fieldGroups: [...tab.fieldGroups, newGroup] };
      }
      return tab;
    });
    updateCurrentForm({ tabs: newTabs });
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<FieldGroup>) => {
    const newTabs = currentForm.tabs.map(tab => ({
      ...tab,
      fieldGroups: tab.fieldGroups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    }));
    updateCurrentForm({ tabs: newTabs });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!window.confirm('Delete this field group and all its fields?')) return;
    const newTabs = currentForm.tabs.map(tab => ({
      ...tab,
      fieldGroups: tab.fieldGroups.filter(g => g.id !== groupId)
    }));
    updateCurrentForm({ tabs: newTabs });
  };

  const handleMoveGroup = (groupId: string, direction: 'up' | 'down') => {
    const newTabs = currentForm.tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const index = tab.fieldGroups.findIndex(g => g.id === groupId);
      if (index === -1) return tab;
      
      const newGroups = [...tab.fieldGroups];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newGroups.length) {
        [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
      }
      
      return { ...tab, fieldGroups: newGroups };
    });
    updateCurrentForm({ tabs: newTabs });
  };

  const handleAddTab = () => {
    const name = window.prompt('Enter Tab Name:');
    if (!name) return;
    const newTab: Tab = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      fieldGroups: [{
        id: Math.random().toString(36).substr(2, 9),
        name: 'Main Section',
        fields: []
      }]
    };
    updateCurrentForm({ tabs: [...currentForm.tabs, newTab] });
    setActiveTabId(newTab.id);
  };

  const handleDeleteTab = (tabId: string) => {
    if (currentForm.tabs.length <= 1) return;
    if (!window.confirm('Delete this tab?')) return;
    const newTabs = currentForm.tabs.filter(t => t.id !== tabId);
    updateCurrentForm({ tabs: newTabs });
    if (activeTabId === tabId) setActiveTabId(newTabs[0].id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 overflow-hidden">
          <Tabs 
            tabs={currentForm.tabs.map(t => ({ id: t.id, label: t.name }))} 
            activeTab={activeTabId} 
            onChange={setActiveTabId} 
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={handleAddTab} title="Add New Tab" className="h-8 w-8 hover:bg-ns-blue/10 hover:text-ns-blue">
            <Plus size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDeleteTab(activeTabId)} 
            disabled={currentForm.tabs.length <= 1}
            title="Delete Current Tab"
            className="h-8 w-8 hover:bg-red-50 text-red-400 disabled:opacity-30"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
        {activeTab?.fieldGroups.slice(0, 1).map(group => (
          <DroppableGroup 
            key={group.id} 
            group={group} 
            onRemoveField={handleRemoveField}
            onSelectField={setSelectedFieldId}
            selectedFieldId={selectedFieldId}
            onUpdateGroup={() => {}}
            onDeleteGroup={() => {}}
            onMoveGroup={() => {}}
            hideHeader={true}
          />
        ))}

        {!activeTab && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-gray-200 rounded-sm italic">
            Select or Create a Tab to begin
          </div>
        )}
      </div>
    </div>
  );
}
