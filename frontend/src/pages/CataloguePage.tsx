import * as React from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  MoreHorizontal,
  GripVertical,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { catalogueApi, CatalogueField, CatalogueFieldCreate } from '../api/catalogue';
import { cn } from '../lib/utils';

export default function CataloguePage() {
  const { type } = useParams<{ type: string }>();
  const [fields, setFields] = React.useState<CatalogueField[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingField, setEditingField] = React.useState<CatalogueField | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  // Map URL param to API transactionType
  const typeMap: Record<string, string> = {
    'purchase-order': 'purchase_order',
    'sales-order': 'sales_order',
    'ap': 'accounts_payable',
    'ar': 'accounts_receivable'
  };

  const displayNames: Record<string, string> = {
    'purchase-order': 'Purchase Order Fields',
    'sales-order': 'Sales Order Fields',
    'ap': 'Accounts Payable Fields',
    'ar': 'Accounts Receivable Fields'
  };

  const transactionType = type ? typeMap[type] : 'purchase_order';
  const displayName = type ? displayNames[type] : 'Purchase Order Fields';

  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await catalogueApi.getFields(transactionType);
      setFields(response.data);
    } catch (error) {
      console.error('Failed to fetch catalogue fields', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFields();
  }, [transactionType]);

  const filteredFields = fields.filter(f => 
    f.label.toLowerCase().includes(search.toLowerCase()) || 
    f.internalId.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: CatalogueFieldCreate) => {
    try {
      if (editingField) {
        await catalogueApi.updateField(editingField._id, data);
      } else {
        await catalogueApi.createField({ ...data, transactionType });
      }
      setIsModalOpen(false);
      setEditingField(null);
      fetchFields();
    } catch (error) {
      console.error('Failed to save field', error);
      alert('Error saving field. Make sure Internal ID is unique.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await catalogueApi.deleteField(id);
      setIsDeleting(null);
      fetchFields();
    } catch (error) {
      console.error('Failed to delete field', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-ns-text-muted uppercase tracking-widest mb-1">
              <span>Field Catalogue</span>
              <ChevronRight size={12} />
              <span className="text-ns-blue">{type?.replace('-', ' ')}</span>
            </div>
            <h1 className="text-2xl font-bold text-ns-navy">{displayName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white text-ns-navy border border-ns-border rounded-sm text-sm font-bold cursor-pointer hover:bg-ns-gray-bg transition-all">
              <Plus size={16} className="rotate-45" />
              Bulk Import
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) {
                      for (const field of data) {
                        await catalogueApi.createField({ ...field, transactionType });
                      }
                      fetchFields();
                      alert(`Successfully imported ${data.length} fields`);
                    }
                  } catch (err) {
                    alert('Invalid JSON file');
                  }
                }}
              />
            </label>
            <button 
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fields, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `catalogue_${transactionType}.json`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-ns-navy border border-ns-border rounded-sm text-sm font-bold hover:bg-ns-gray-bg transition-all"
            >
              <Search size={16} className="rotate-90" />
              Export
            </button>
            <button 
              onClick={() => {
                setEditingField(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-ns-blue text-white rounded-sm text-sm font-bold shadow-lg shadow-ns-blue/20 hover:bg-ns-navy transition-all transform hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Add New Field
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-sm border border-ns-border shadow-sm flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by label or internal ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-ns-text-muted">
            <span className="font-bold">{filteredFields.length}</span> fields found
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-sm border border-ns-border shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ns-gray-bg border-b border-ns-border">
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider w-10"></th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider">Internal ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider">Label</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider text-center">Section</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider text-center">Tab</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider">Group</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider text-center">nlapi</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider text-center">Req.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ns-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-ns-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-ns-blue" />
                    <span>Loading catalogue...</span>
                  </td>
                </tr>
              ) : filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-ns-text-muted">
                    No fields found matching your search.
                  </td>
                </tr>
              ) : (
                filteredFields.map((field) => (
                  <tr key={field._id} className="hover:bg-ns-gray-bg/50 transition-colors group">
                    <td className="px-6 py-4">
                      <GripVertical className="text-gray-300 cursor-grab active:cursor-grabbing" size={16} />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-ns-navy font-semibold">{field.internalId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-ns-text">
                      <div className="flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Required" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-widest text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-sm border",
                        field.section === 'body' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                      )}>
                        {field.section === 'sublist' ? `${field.subSection}` : 'body'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-ns-navy bg-ns-gray-bg px-2 py-1 rounded-sm border border-ns-border uppercase">
                        {field.tab}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-ns-text-muted truncate max-w-[120px]">
                      {field.group}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {field.nlapiSubmitField ? (
                        <Check size={14} className="text-green-500 mx-auto" />
                      ) : (
                        <X size={14} className="text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {field.required ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase">Yes</span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingField(field);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-ns-blue hover:bg-ns-blue/5 rounded-sm transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setIsDeleting(field._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Modal */}
      {isModalOpen && (
        <FieldModal 
          field={editingField}
          onClose={() => {
             setIsModalOpen(false);
             setEditingField(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleting && (
        <div className="fixed inset-0 bg-ns-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6">
               <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                 <Trash2 size={24} />
               </div>
               <h3 className="text-lg font-bold text-ns-navy mb-2">Delete Field?</h3>
               <p className="text-sm text-ns-text-muted mb-6">
                 Are you sure you want to delete this field from the catalogue? This action cannot be undone.
               </p>
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setIsDeleting(null)}
                   className="flex-1 px-4 py-2 text-sm font-bold text-ns-text-muted hover:bg-ns-gray-bg rounded-sm border border-ns-border transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => handleDelete(isDeleting)}
                   className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-sm shadow-lg shadow-red-200 transition-all"
                 >
                   Delete Field
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

interface FieldModalProps {
  field: CatalogueField | null;
  onClose: () => void;
  onSave: (data: CatalogueFieldCreate) => void;
}

function FieldModal({ field, onClose, onSave }: FieldModalProps) {
  const [formData, setFormData] = React.useState<CatalogueFieldCreate>({
    internalId: field?.internalId || '',
    label: field?.label || '',
    type: field?.type || 'text',
    nlapiSubmitField: field?.nlapiSubmitField || false,
    required: field?.required || false,
    transactionType: field?.transactionType || '',
    isSystemField: field?.isSystemField || false,
    section: field?.section || 'body',
    subSection: field?.subSection || null,
    group: field?.group || 'Primary Information',
    tab: field?.tab || 'Main',
    displayOrder: field?.displayOrder || 100,
    origin: field?.origin || 'system'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.internalId || !formData.label) {
      alert('Internal ID and Label are required');
      return;
    }
    onSave(formData);
  };

  const fieldTypes = [
    'text', 'select', 'currency', 'checkbox', 'date', 'datetime', 'textarea', 
    'integer', 'double', 'email', 'url', 'phone', 'RecordRef',
    'address', 'summary', 'emails', 'currency2'
  ];

  return (
    <div className="fixed inset-0 bg-ns-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-ns-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-ns-navy">
            {field ? 'Edit Field' : 'Add New Field'}
          </h2>
          <button onClick={onClose} className="text-ns-text-muted hover:text-ns-navy transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
                Internal ID
              </label>
              <input 
                type="text" 
                value={formData.internalId}
                onChange={e => setFormData({ ...formData, internalId: e.target.value })}
                placeholder="e.g. custbody_my_field"
                className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
                Label
              </label>
              <input 
                type="text" 
                value={formData.label}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. My Custom Field"
                className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
              Field Type
            </label>
            <select 
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue transition-all"
            >
              {fieldTypes.sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
              Section
            </label>
            <select 
              value={formData.section}
              onChange={e => setFormData({ ...formData, section: e.target.value as any, subSection: e.target.value === 'body' ? null : 'item' })}
              className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
            >
              <option value="body">Body Field</option>
              <option value="sublist">Sublist Field</option>
            </select>
          </div>

          {formData.section === 'sublist' && (
            <div>
              <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
                Sub Section
              </label>
              <select 
                value={formData.subSection || 'item'}
                onChange={e => setFormData({ ...formData, subSection: e.target.value as any })}
                className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
              >
                <option value="item">Line Item</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
              NetSuite Tab
            </label>
            <select 
              value={formData.tab}
              onChange={e => setFormData({ ...formData, tab: e.target.value })}
              className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
            >
              <option value="Main">Main</option>
              <option value="Items">Items</option>
              <option value="Shipping">Shipping</option>
              <option value="Billing">Billing</option>
              <option value="Tax Details">Tax Details</option>
            </select>
          </div>

          <div className={cn(formData.section === 'body' ? "col-span-1" : "col-span-2")}>
            <label className="block text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-1.5">
              Group Name
            </label>
            <input 
              type="text" 
              value={formData.group}
              onChange={e => setFormData({ ...formData, group: e.target.value })}
              placeholder="e.g. Primary Information"
              className="w-full px-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
            />
          </div>

          <div className="flex items-center gap-6 col-span-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.required}
                onChange={e => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 rounded text-ns-blue focus:ring-ns-blue"
              />
              <span className="text-xs font-bold text-ns-navy">Mandatory</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.nlapiSubmitField}
                onChange={e => setFormData({ ...formData, nlapiSubmitField: e.target.checked })}
                className="w-4 h-4 rounded text-ns-blue focus:ring-ns-blue"
              />
              <span className="text-xs font-bold text-ns-navy">nlapiSubmitField</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.isSystemField}
                onChange={e => setFormData({ ...formData, isSystemField: e.target.checked })}
                className="w-4 h-4 rounded text-ns-blue focus:ring-ns-blue"
              />
              <span className="text-xs font-bold text-ns-navy">System Field</span>
            </label>
          </div>
        </form>

        <div className="p-6 bg-ns-gray-bg border-t border-ns-border flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-ns-text-muted hover:bg-white rounded-sm border border-ns-border transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-ns-blue hover:bg-ns-navy rounded-sm shadow-lg shadow-ns-blue/20 transition-all"
          >
            {field ? 'Update Field' : 'Save Field'}
          </button>
        </div>
      </div>
    </div>
  );
}
