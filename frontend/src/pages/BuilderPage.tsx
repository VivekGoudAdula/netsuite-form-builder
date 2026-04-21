import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import CataloguePanel from '../components/builder/CataloguePanel';
import BuilderCanvas from '../components/builder/BuilderCanvas';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import BuilderTopBar from '../components/builder/BuilderTopBar';
import { Field, Tab, FieldGroup } from '../types';

export default function BuilderPage() {
  const { 
    currentForm, updateCurrentForm, catalogues, 
    activeTabId, setActiveTabId, 
    selectedFieldId, setSelectedFieldId,
    fetchCatalogue, fetchFormById
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDragItem, setActiveDragItem] = React.useState<Field | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    const formIdFromState = (location.state as any)?.formId;
    
    if (formIdFromState && (!currentForm || currentForm.id !== formIdFromState)) {
      fetchFormById(formIdFromState);
    } else if (!currentForm && !formIdFromState) {
      navigate('/dashboard');
    } else if (currentForm) {
      if (!activeTabId && currentForm.tabs.length > 0) {
        setActiveTabId(currentForm.tabs[0].id);
      }
      fetchCatalogue(currentForm.transactionType);
    }
  }, [currentForm, navigate, activeTabId, fetchCatalogue, location.state, fetchFormById]);

  if (!currentForm) return null;

  const catalogue = catalogues[currentForm.transactionType];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const fieldId = active.id as string;
    
    // Check if it's from catalogue or canvas
    const field = catalogue.fields.find(f => f.id === fieldId) || 
                  currentForm.tabs.flatMap(t => t.fieldGroups.flatMap(g => g.fields)).find(f => f.id === fieldId);
    
    if (field) setActiveDragItem(field);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Logic for dropping from catalogue to group or reordering
    // Simplified for prototype: 
    // If dropped over a group, add to that group if not already there
    if (overId.startsWith('group-')) {
      const groupId = overId.replace('group-', '');
      const field = catalogue.fields.find(f => f.id === activeId);
      
      if (field) {
        const newTabs = currentForm.tabs.map(tab => ({
          ...tab,
          fieldGroups: tab.fieldGroups.map(group => {
            if (group.id === groupId) {
              // Check if field already exists in any group
              const exists = currentForm.tabs.some(t => t.fieldGroups.some(g => g.fields.some(f => f.id === field.id)));
              if (!exists) {
                return { ...group, fields: [...group.fields, field] };
              }
            }
            return group;
          })
        }));
        updateCurrentForm({ tabs: newTabs });
      }
    }
  };

  const selectedField = currentForm.tabs
    .flatMap(t => t.fieldGroups.flatMap(g => g.fields))
    .find(f => f.id === selectedFieldId);

  return (
    <div className="h-screen flex flex-col bg-[#f0f0f0] overflow-hidden">
      <BuilderTopBar />
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-64 border-r border-[#cccccc] bg-white flex flex-col">
            <CataloguePanel />
          </div>

          {/* Center Panel */}
          <div className="flex-1 flex flex-col overflow-auto p-6 bg-[#f5f5f5]">
            <BuilderCanvas 
              activeTabId={activeTabId} 
              setActiveTabId={setActiveTabId}
              selectedFieldId={selectedFieldId}
              setSelectedFieldId={setSelectedFieldId}
            />
          </div>

          {/* Right Panel */}
          <div className="w-80 border-l border-[#cccccc] bg-white flex flex-col">
            <PropertiesPanel selectedField={selectedField} />
          </div>
        </div>

        <DragOverlay>
          {activeDragItem ? (
            <div className="bg-white border border-[#607799] p-2 rounded shadow-lg text-xs font-medium flex items-center gap-2 w-48 opacity-80">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              {activeDragItem.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
