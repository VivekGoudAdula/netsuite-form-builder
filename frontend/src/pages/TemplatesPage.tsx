import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { Modal } from '../components/ui/Complex';
import { Library, Layout, ShieldCheck, Settings2, FileCode, ChevronRight } from 'lucide-react';
import { PageHeader, Card } from '../components/admin';
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Templates"
          title="Form templates"
          subtitle="Ready-made forms you can customize for each company."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="flex flex-col transition-all hover:border-ns-blue/40">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-ns-md bg-ns-light-blue/20 flex items-center justify-center text-ns-blue border border-ns-blue/20">
                    <Layout size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ns-navy text-lg">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-white bg-ns-blue px-2 py-0.5 rounded-full">
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
                    <span key={tag} className="text-[10px] bg-ns-gray-bg text-ns-text-muted border border-ns-border px-2 py-0.5 rounded-ns-md font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
                <Button onClick={() => handleUseTemplate(template)} className="gap-2 h-9 px-4">
                  Use template <ChevronRight size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="Create form from template"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsUseModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateSubmit} disabled={!formDetails.name}>Create form</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-ns-blue/5 border border-ns-blue/10 rounded-ns-md mb-4">
            <h4 className="text-[10px] font-bold text-ns-blue uppercase tracking-widest mb-1">Template</h4>
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-ns-navy" />
              <p className="text-xs text-ns-navy font-bold">{selectedTemplate?.name}</p>
            </div>
          </div>

          <div>
            <Label mandatory>Company</Label>
            <Select
              value={formDetails.customerId}
              onChange={(e) => setFormDetails({ ...formDetails, customerId: e.target.value })}
              options={companies.map(c => ({ label: c.name, value: c.id }))}
            />
            <p className="text-[10px] text-ns-text-muted mt-1 italic">The form will be available only for this company.</p>
          </div>

          <div>
            <Label mandatory>Form name</Label>
            <Input
              placeholder="e.g. Acme Corp Purchase Order"
              value={formDetails.name}
              onChange={(e) => setFormDetails({ ...formDetails, name: e.target.value })}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
