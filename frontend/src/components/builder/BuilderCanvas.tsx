import * as React from 'react';
import { useStore } from '../../store/useStore';
import { Tabs, ConfirmModal } from '../ui/Complex';
import { Button, Input } from '../ui/Base';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { FieldGroup, Tab } from '../../types';
import { FieldControlPreview } from '../ui/FieldControl';

const SublistRenderer = ({ name, fields, onRemoveField, onSelectField, selectedFieldId }: any) => {
  return (
    <div className="bg-white border border-ns-border rounded-sm mb-8 ns-panel-shadow overflow-hidden">
      <div className="px-5 py-3 border-b border-ns-border ns-header-gradient flex justify-between items-center">
        <h3 className="text-[11px] font-bold text-ns-text uppercase tracking-[0.15em]">{name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ns-gray-bg border-b border-ns-border">
              <th className="px-4 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider">Field</th>
              <th className="px-4 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ns-border">
            {fields.map((field: any) => (
              <tr 
                key={field.id}
                onClick={() => onSelectField(field.id)}
                className={cn(
                  "hover:bg-ns-gray-bg transition-colors cursor-pointer",
                  selectedFieldId === field.id ? "bg-ns-blue/[0.03]" : ""
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-ns-navy">{field.label}</span>
                    <span className="text-[10px] text-ns-text-muted font-mono">{field.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                   <span className="px-2 py-0.5 bg-gray-100 border border-ns-border rounded-sm text-[9px] font-bold text-ns-text-muted uppercase tracking-tight">
                    {field.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fields.length === 0 && (
          <div className="p-10 text-center text-gray-300 italic text-[11px] uppercase tracking-widest">
            Drop sublist fields here
          </div>
        )}
      </div>
    </div>
  );
};

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
        {!hideHeader && (
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
        )}
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6 min-h-[120px]">
        {group.fields.map((field: any) => (
          <div 
            key={field.id}
            onClick={(e) => { e.stopPropagation(); onSelectField(field.id); }}
            className={cn(
              "p-3 border rounded-sm cursor-pointer transition-all relative select-none",
              selectedFieldId === field.id 
                ? "border-ns-blue bg-ns-blue/[0.03] ring-1 ring-ns-blue/30" 
                : "border-transparent hover:border-ns-border hover:bg-gray-50/50"
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <GripVertical size={12} className="text-ns-blue/30 shrink-0" />
              <label className={cn(
                "text-[10px] font-bold uppercase tracking-wider block transition-colors truncate flex-1",
                selectedFieldId === field.id ? "text-ns-blue" : "text-ns-text-muted"
              )}>
                {field.label}{field.mandatory && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            </div>
            <div className={cn(field.displayType === 'hidden' && "opacity-30")}>
              <FieldControlPreview fieldType={field.type} checkBoxDefault={field.checkBoxDefault} />
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
              className="absolute -top-2 -right-2 bg-white border border-ns-border rounded-full p-1 text-gray-400 hover:text-red-500 shadow-sm transition-all z-10"
              title="Remove Field"
            >
              <Trash2 size={12} />
            </button>
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
  const [confirmState, setConfirmState] = React.useState<{ 
    isOpen: boolean; 
    type: 'field' | 'group' | 'tab' | null;
    id: string | null;
    message: string;
    title: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    message: '',
    title: ''
  });

  if (!currentForm) return null;

  const activeTab = currentForm.tabs.find(t => t.id === activeTabId);

  const openConfirm = (type: 'field' | 'group' | 'tab', id: string, title: string, message: string) => {
    setConfirmState({ isOpen: true, type, id, title, message });
  };

  const handleRemoveField = (fieldId: string) => {
    openConfirm('field', fieldId, 'Remove Field?', 'This will remove the field from this layout blueprint.');
  };

  const processRemoveField = (fieldId: string) => {
    const newTabs = currentForm.tabs.map(tab => ({
      ...tab,
      fieldGroups: tab.fieldGroups.map(group => ({
        ...group,
        fields: group.fields.filter(f => f.id !== fieldId)
      })),
      itemSublist: tab.itemSublist?.filter(f => f.id !== fieldId),
      expenseSublist: tab.expenseSublist?.filter(f => f.id !== fieldId)
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
    openConfirm('group', groupId, 'Delete Field Group?', 'Are you sure? All fields within this group will be removed from the tab.');
  };

  const processDeleteGroup = (groupId: string) => {
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
    openConfirm('tab', tabId, 'Delete Tab?', 'This will permanently delete the tab and all its hierarchical containers.');
  };

  const processDeleteTab = (tabId: string) => {
    const newTabs = currentForm.tabs.filter(t => t.id !== tabId);
    updateCurrentForm({ tabs: newTabs });
    if (activeTabId === tabId) setActiveTabId(newTabs[0].id);
  };

  const handleConfirmAction = () => {
    if (!confirmState.id) return;
    switch (confirmState.type) {
      case 'field': processRemoveField(confirmState.id); break;
      case 'group': processDeleteGroup(confirmState.id); break;
      case 'tab': processDeleteTab(confirmState.id); break;
    }
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
        {activeTab?.name === 'Items' ? (
          <div className="space-y-6">
            <SublistRenderer 
              name="Line Items" 
              fields={activeTab.itemSublist || []} 
              onRemoveField={handleRemoveField} 
              onSelectField={setSelectedFieldId} 
              selectedFieldId={selectedFieldId} 
            />
            <SublistRenderer 
              name="Expenses" 
              fields={activeTab.expenseSublist || []} 
              onRemoveField={handleRemoveField} 
              onSelectField={setSelectedFieldId} 
              selectedFieldId={selectedFieldId} 
            />
          </div>
        ) : (
          activeTab?.fieldGroups.map(group => (
            <DroppableGroup 
              key={group.id} 
              group={group} 
              onRemoveField={handleRemoveField}
              onSelectField={setSelectedFieldId}
              selectedFieldId={selectedFieldId}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onMoveGroup={handleMoveGroup}
              hideHeader={false}
            />
          ))
        )}

        {!activeTab && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-gray-200 rounded-sm italic">
            Select or Create a Tab to begin
          </div>
        )}
      </div>
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        message={confirmState.message}
      />
    </div>
  );
}
