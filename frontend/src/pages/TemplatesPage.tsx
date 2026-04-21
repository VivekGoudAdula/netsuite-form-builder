import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { Modal } from '../components/ui/Complex';
import { Library, Layout, ShieldCheck, Settings2, FileCode, ChevronRight } from 'lucide-react';
import { FormTemplate, TransactionType } from '../types';

export default function TemplatesPage() {
  const { templates, companies, catalogues, fetchCompanies, createForm } = useStore();
  const navigate = useNavigate();
  const [isUseModalOpen, setIsUseModalOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<FormTemplate | null>(null);
  const [formDetails, setFormDetails] = React.useState({
    name: '',
    customerId: companies[0]?.id || '',
  });

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleUseTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setIsUseModalOpen(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setFormDetails({
      name: `${template.name} - ${timestamp}`,
      customerId: companies[0]?.id || '',
    });
  };

  const handleCreateSubmit = async () => {
    if (!formDetails.name) {
      alert('Please provide a configuration name.');
      return;
    }
    if (!selectedTemplate) return;

    await createForm(
      formDetails.name, 
      formDetails.customerId, 
      selectedTemplate.transactionType,
      selectedTemplate.tabs
    );
    
    setIsUseModalOpen(false);
    navigate('/builder');
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <Library size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Blueprint Library</span>
            </div>
            <h1 className="text-3xl font-bold text-ns-text">System Templates</h1>
            <p className="text-sm text-ns-text-muted mt-1">Pre-configured industry standard transaction schemas ready for deployment.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow flex flex-col transition-all hover:border-ns-blue hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-sm bg-ns-light-blue/20 flex items-center justify-center text-ns-blue border border-ns-blue/20">
                    <Layout size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ns-navy text-lg">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-white bg-ns-navy px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {catalogues[template.transactionType].name}
                      </span>
                      <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter">
                        {template.tabs.length} TABS • {template.tabs.reduce((acc, tab) => 
                          acc + 
                          tab.fieldGroups.reduce((acc2, grp) => acc2 + grp.fields.length, 0) + 
                          (tab.itemSublist?.length || 0) + 
                          (tab.expenseSublist?.length || 0)
                        , 0)} FIELDS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-ns-text-muted leading-relaxed mb-6 flex-1">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-ns-border">
                <div className="flex gap-2">
                  {template.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-ns-gray-bg text-ns-text-muted border border-ns-border px-2 py-0.5 rounded-sm font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
                <Button onClick={() => handleUseTemplate(template)} className="gap-2 h-9 px-4">
                  Use Blueprint <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="Initialize From Blueprint"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsUseModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateSubmit} disabled={!formDetails.name}>Provision Schema</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-ns-blue/5 border border-ns-blue/10 rounded-sm mb-4">
            <h4 className="text-[10px] font-bold text-ns-blue uppercase tracking-widest mb-1">Source Blueprint</h4>
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-ns-navy"/>
              <p className="text-xs text-ns-navy font-bold">{selectedTemplate?.name}</p>
            </div>
          </div>

          <div>
            <Label mandatory>Target Client Entity</Label>
            <Select 
              value={formDetails.customerId}
              onChange={(e) => setFormDetails({...formDetails, customerId: e.target.value})}
              options={companies.map(c => ({ label: c.name, value: c.id }))}
            />
            <p className="text-[10px] text-ns-text-muted mt-1 italic">The initialized form will be isolated to this entity.</p>
          </div>
          
          <div>
            <Label mandatory>Configuration Identifier</Label>
            <Input 
              placeholder="e.g. Acme Corp Purchase Order" 
              value={formDetails.name}
              onChange={(e) => setFormDetails({...formDetails, name: e.target.value})}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
