import * as React from 'react';
import { useStore } from '../../store/useStore';
import { Input, Label, Select, Checkbox, Button } from '../ui/Base';
import { Field } from '../../types';
import { Settings2, Info, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import {
  getDataSourceOptionsForField,
  resolveDataSourceSelectValue,
} from '../../lib/fieldDataSourceOptions';

export default function PropertiesPanel({ selectedField }: { selectedField: Field | undefined }) {
  const { currentForm, updateCurrentForm } = useStore();

  const dataSourceSelectOptions = React.useMemo(() => {
    if (!selectedField) {
      return [
        { label: 'Static', value: 'static' as const },
        { label: 'API', value: 'api' as const },
      ];
    }
    const base = getDataSourceOptionsForField(selectedField.id);
    const resolved = resolveDataSourceSelectValue(selectedField.dataSource);
    if (base.some(o => o.value === resolved)) return base;
    const legacy =
      resolved === 'api'
        ? 'API (current)'
        : resolved === 'netsuite_currency'
          ? 'NetSuite Currency (current)'
          : resolved === 'netsuite_hsn'
            ? 'NetSuite HSN Codes (current)'
            : resolved === 'netsuite_employees'
              ? 'NetSuite Employees (current)'
              : resolved === 'netsuite_location'
                ? 'NetSuite Locations (current)'
                : `${resolved} (current)`;
    return [...base, { label: legacy, value: resolved }];
  }, [
    selectedField?.id,
    selectedField?.dataSource?.type,
    selectedField?.dataSource?.apiConfig?.url,
  ]);

  const dataSourceSelectValue = React.useMemo(() => {
    if (!selectedField) return 'static';
    return resolveDataSourceSelectValue(selectedField.dataSource);
  }, [
    selectedField?.id,
    selectedField?.dataSource?.type,
    selectedField?.dataSource?.apiConfig?.url,
  ]);

  if (!selectedField || !currentForm) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center text-gray-400 bg-white">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6">
          <Settings2 size={32} className="opacity-20" />
        </div>
        <h3 className="text-xs font-bold text-ns-text uppercase tracking-widest mb-2">No Field Selected</h3>
        <p className="text-[11px] text-ns-text-muted leading-relaxed">Select a field element from the builder canvas to configure its properties and layout settings.</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<Field>) => {
    const newTabs = currentForm.tabs.map(tab => ({
      ...tab,
      fieldGroups: tab.fieldGroups.map(group => ({
        ...group,
        fields: group.fields.map(field => 
          field.id === selectedField.id ? { ...field, ...updates } : field
        )
      })),
      itemSublist: tab.itemSublist?.map(field => 
        field.id === selectedField.id ? { ...field, ...updates } : field
      ),
      expenseSublist: tab.expenseSublist?.map(field => 
        field.id === selectedField.id ? { ...field, ...updates } : field
      )
    }));
    updateCurrentForm({ tabs: newTabs });
  };

  const handleMoveField = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    const newTabs = currentForm.tabs.map(tab => {
      // 1. Try moving in field groups
      const updatedFieldGroups = tab.fieldGroups.map(group => {
        const index = group.fields.findIndex(f => f.id === selectedField.id);
        if (index === -1) return group;
        
        const newFields = [...group.fields];
        const field = newFields.splice(index, 1)[0];
        
        if (direction === 'up') newFields.splice(Math.max(0, index - 1), 0, field);
        else if (direction === 'down') newFields.splice(Math.min(newFields.length, index + 1), 0, field);
        else if (direction === 'top') newFields.unshift(field);
        else if (direction === 'bottom') newFields.push(field);
        
        return { ...group, fields: newFields };
      });

      // 2. Try moving in item sublist
      let updatedItemSublist = tab.itemSublist;
      if (tab.itemSublist) {
        const index = tab.itemSublist.findIndex(f => f.id === selectedField.id);
        if (index !== -1) {
          const newFields = [...tab.itemSublist];
          const field = newFields.splice(index, 1)[0];
          if (direction === 'up') newFields.splice(Math.max(0, index - 1), 0, field);
          else if (direction === 'down') newFields.splice(Math.min(newFields.length, index + 1), 0, field);
          else if (direction === 'top') newFields.unshift(field);
          else if (direction === 'bottom') newFields.push(field);
          updatedItemSublist = newFields;
        }
      }

      // 3. Try moving in expense sublist
      let updatedExpenseSublist = tab.expenseSublist;
      if (tab.expenseSublist) {
        const index = tab.expenseSublist.findIndex(f => f.id === selectedField.id);
        if (index !== -1) {
          const newFields = [...tab.expenseSublist];
          const field = newFields.splice(index, 1)[0];
          if (direction === 'up') newFields.splice(Math.max(0, index - 1), 0, field);
          else if (direction === 'down') newFields.splice(Math.min(newFields.length, index + 1), 0, field);
          else if (direction === 'top') newFields.unshift(field);
          else if (direction === 'bottom') newFields.push(field);
          updatedExpenseSublist = newFields;
        }
      }

      return { 
        ...tab, 
        fieldGroups: updatedFieldGroups,
        itemSublist: updatedItemSublist,
        expenseSublist: updatedExpenseSublist
      };
    });
    updateCurrentForm({ tabs: newTabs });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-ns-border">
      <div className="p-4 border-b border-ns-border bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-ns-blue" />
          <h2 className="text-[11px] font-bold text-ns-text uppercase tracking-[0.15em]">Field Properties</h2>
        </div>
        <div className="text-[10px] font-mono text-ns-text-muted bg-gray-100 px-1.5 py-0.5 rounded">
          UUID: {selectedField.id.substring(0, 8)}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-8 custom-scrollbar">
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-ns-blue/10 pb-2">Identification</h3>
          <div className="space-y-4">
            <div>
              <Label>Field Label</Label>
              <Input 
                value={selectedField.label} 
                onChange={(e) => handleUpdate({ label: e.target.value })} 
                className="font-bold text-ns-navy"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50/30 rounded-sm border border-ns-blue/10">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-ns-navy uppercase tracking-wide">Mandatory</span>
                <span className="text-[10px] text-ns-text-muted">Required NetSuite Logic</span>
              </div>
              <Checkbox 
                checked={selectedField.mandatory} 
                onChange={(e) => handleUpdate({ mandatory: e.target.checked })} 
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-ns-blue/10 pb-2">Appearance & Defaults</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Display Type</Label>
              <Select 
                value={selectedField.displayType}
                onChange={(e) => handleUpdate({ displayType: e.target.value as any })}
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Disabled', value: 'disabled' },
                  { label: 'Hidden', value: 'hidden' }
                ]} 
              />
            </div>
            <div>
              <Label>Default State</Label>
              <Select 
                value={selectedField.checkBoxDefault}
                onChange={(e) => handleUpdate({ checkBoxDefault: e.target.value as any })}
                options={[
                  { label: 'Default', value: 'default' },
                  { label: 'Checked', value: 'checked' },
                  { label: 'Unchecked', value: 'unchecked' }
                ]} 
              />
            </div>
          </div>
        </section>

        {(selectedField.type === 'select' || selectedField.type === 'RecordRef') && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-ns-blue/10 pb-2">Data Source</h3>
            <div className="space-y-4">
              <div>
                <Label>Datasource Type</Label>
                <Select 
                  value={dataSourceSelectValue}
                  onChange={(e) => {
                    const v = e.target.value as
                      | 'static'
                      | 'api'
                      | 'netsuite_currency'
                      | 'netsuite_hsn'
                      | 'netsuite_employees'
                      | 'netsuite_location';
                    if (v === 'static') {
                      handleUpdate({
                        dataSource: {
                          type: 'static',
                          options: selectedField.dataSource?.options || [],
                        },
                      });
                      return;
                    }
                    if (v === 'netsuite_employees') {
                      handleUpdate({
                        dataSource: {
                          type: 'netsuite_employees',
                          apiConfig: {
                            url: 'netsuite/employees',
                            method: 'GET',
                            labelKey: 'label',
                            valueKey: 'value',
                          },
                        },
                      });
                      return;
                    }
                    if (v === 'netsuite_currency') {
                      handleUpdate({
                        dataSource: {
                          type: 'netsuite_currency',
                          apiConfig: {
                            url: 'currencies/',
                            method: 'GET',
                            labelKey: 'name',
                            valueKey: 'internalId',
                          },
                        },
                      });
                      return;
                    }
                    if (v === 'netsuite_hsn') {
                      handleUpdate({
                        dataSource: {
                          type: 'netsuite_hsn',
                          endpoint: 'hsn-codes/search',
                          apiConfig: {
                            url: 'hsn-codes/search',
                            method: 'GET',
                            labelKey: 'name',
                            valueKey: 'internalId',
                            searchKey: 'hsncode',
                          },
                        },
                      });
                      return;
                    }
                    if (v === 'netsuite_location') {
                      handleUpdate({
                        dataSource: {
                          type: 'netsuite_location',
                          endpoint: 'locations/search',
                          apiConfig: {
                            url: 'locations/search',
                            method: 'GET',
                            labelKey: 'name',
                            valueKey: 'internalId',
                            searchKey: 'name',
                          },
                        },
                      });
                      return;
                    }
                    const prev = selectedField.dataSource;
                    const migrated =
                      prev?.apiConfig?.url
                        ? prev.apiConfig
                        : {
                            url: '',
                            method: 'GET',
                            labelKey: 'label',
                            valueKey: 'value',
                          };
                    handleUpdate({
                      dataSource: {
                        type: 'api',
                        apiConfig: migrated,
                      },
                    });
                  }}
                  options={dataSourceSelectOptions} 
                />
              </div>
              
              {(selectedField.dataSource?.type === 'api' ||
                selectedField.dataSource?.type === 'netsuite_currency' ||
                selectedField.dataSource?.type === 'netsuite_hsn' ||
                selectedField.dataSource?.type === 'netsuite_employees' ||
                selectedField.dataSource?.type === 'netsuite_location') && (
                <div className="space-y-3 p-3 bg-ns-light-blue/30 rounded-sm border border-ns-blue/10">
                  <div>
                    <Label>API Configuration</Label>
                    <div className="text-[10px] text-ns-text-muted mb-2 font-medium bg-white/50 p-2 rounded">
                      Path relative to <span className="font-mono">/api</span> (e.g.{' '}
                      <span className="font-mono">currencies/</span>,{' '}
                      <span className="font-mono">hsn-codes/</span>,{' '}
                      <span className="font-mono">locations/</span>,{' '}
                      <span className="font-mono">netsuite/employees</span>).
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">API Endpoint URL</Label>
                    <Input 
                      value={selectedField.dataSource.apiConfig?.url || ''} 
                      onChange={(e) => handleUpdate({ 
                        dataSource: { 
                          ...selectedField.dataSource!, 
                          apiConfig: { ...(selectedField.dataSource?.apiConfig || { method: 'GET', labelKey: 'name', valueKey: 'id' }), url: e.target.value } 
                        } 
                      })}
                      placeholder="netsuite/employees"
                      className="bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Label Key</Label>
                      <Input 
                        value={selectedField.dataSource.apiConfig?.labelKey || ''} 
                        onChange={(e) => handleUpdate({ 
                          dataSource: { 
                            ...selectedField.dataSource!, 
                            apiConfig: { ...(selectedField.dataSource?.apiConfig || { url: '', method: 'GET', valueKey: 'id' }), labelKey: e.target.value } 
                          } 
                        })}
                        placeholder="name"
                        className="bg-white text-[11px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Value Key</Label>
                      <Input 
                        value={selectedField.dataSource.apiConfig?.valueKey || ''} 
                        onChange={(e) => handleUpdate({ 
                          dataSource: { 
                            ...selectedField.dataSource!, 
                            apiConfig: { ...(selectedField.dataSource?.apiConfig || { url: '', method: 'GET', labelKey: 'name' }), valueKey: e.target.value } 
                          } 
                        })}
                        placeholder="id"
                        className="bg-white text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-ns-blue animate-pulse" />
                    <span className="text-[9px] font-bold text-ns-blue uppercase tracking-widest">⚡ Dynamic Mode Active</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-ns-blue/10 pb-2">Field Ordering</h3>
          <div className="grid grid-cols-4 gap-1">
            <Button variant="secondary" size="icon" className="h-9 w-full rounded-sm" onClick={() => handleMoveField('top')} title="Move to Top"><ChevronsUp size={14}/></Button>
            <Button variant="secondary" size="icon" className="h-9 w-full rounded-sm" onClick={() => handleMoveField('up')} title="Move Up"><ChevronUp size={14}/></Button>
            <Button variant="secondary" size="icon" className="h-9 w-full rounded-sm" onClick={() => handleMoveField('down')} title="Move Down"><ChevronDown size={14}/></Button>
            <Button variant="secondary" size="icon" className="h-9 w-full rounded-sm" onClick={() => handleMoveField('bottom')} title="Move to Bottom"><ChevronsDown size={14}/></Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-ns-blue/10 pb-2">Layout Settings</h3>
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-sm">
              <span className="text-[11px] font-medium text-ns-text">Break Column After</span>
              <Checkbox 
                checked={selectedField.layout.columnBreak} 
                onChange={(e) => handleUpdate({ layout: { ...selectedField.layout, columnBreak: e.target.checked } })} 
              />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-sm">
              <span className="text-[11px] font-medium text-ns-text">Add Vertical Buffer</span>
              <Checkbox 
                checked={selectedField.layout.spaceBefore} 
                onChange={(e) => handleUpdate({ layout: { ...selectedField.layout, spaceBefore: e.target.checked } })} 
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-ns-blue/10 pb-2">Metadata</h3>
          <div>
            <Label>NetSuite Help Text</Label>
            <textarea 
              className="w-full text-xs p-3 border border-ns-border rounded-sm focus:outline-none focus:ring-ns-blue/10 min-h-[80px] bg-gray-50/30 text-ns-text leading-relaxed"
              value={selectedField.helpText || ''} 
              onChange={(e) => handleUpdate({ helpText: e.target.value })} 
              placeholder="Detailed explanation for system users..."
            />
          </div>
        </section>

        <div className="mt-8 p-4 bg-ns-navy text-white rounded-sm shadow-xl flex gap-3 relative overflow-hidden group border border-white/5">
          <Info size={18} className="text-ns-blue shrink-0 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ns-blue">ERP Optimization</h4>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Mandatory fields are enforced at the system server level, while Display Type 'Hidden' allows data retention without UI clutter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
