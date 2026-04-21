import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button, Label } from '../components/ui/Base';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/HorizontalTabs';
import { FieldControl } from '../components/ui/FieldControl';
import { CustomForm } from '../types';
import { 
  FileCheck, 
  ArrowLeft, 
  Send, 
  Save, 
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function FormFillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchMyFormDetails, submitForm, isLoading } = useStore();
  
  const [form, setForm] = React.useState<CustomForm | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (id) {
       fetchMyFormDetails(id).then(data => {
         if (data) setForm(data);
       });
    }
  }, [id, fetchMyFormDetails]);

  React.useEffect(() => {
    if (form && form.tabs.length > 0) {
      setActiveTab(form.tabs[0].id);
      
      // Initialize default checkbox values
      const initialValues: Record<string, any> = {};
      form.tabs.forEach(tab => {
        tab.fieldGroups.forEach(group => {
          group.fields.forEach(field => {
            if (field.checkBoxDefault === 'checked') initialValues[field.id] = true;
          });
        });
      });
      setFormValues(initialValues);
    }
  }, [form]);

  if (!form && isLoading) return (
     <CustomerLayout>
       <div className="flex items-center justify-center py-20">
         <div className="h-8 w-8 border-4 border-ns-blue/30 border-t-ns-blue rounded-full animate-spin" />
       </div>
     </CustomerLayout>
  );
  
  if (!form) return <div>Form not found or access denied.</div>;

  if (form.status === 'Submitted') {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 border border-green-200 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-ns-navy">Submission Finalized</h2>
          <p className="text-ns-text-muted mt-2 max-w-md">The '{form.name}' has been successfully submitted and is in read-only protection mode.</p>
          <Button onClick={() => navigate('/customer-dashboard')} className="mt-8 gap-2">
            <ArrowLeft size={16} /> Return to Assignments
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    // Basic required field validation
    let missingFields = false;
    form.tabs.forEach(tab => {
      tab.fieldGroups.forEach(group => {
        group.fields.forEach(field => {
          if (field.mandatory && !formValues[field.id]) {
            missingFields = true;
          }
        });
      });
    });

    if (missingFields) {
      alert('Required fields are missing. Please review all tabs.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await submitForm(form.id, formValues);
      setIsSubmitting(false);
      navigate('/customer-dashboard');
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.response?.data?.detail || 'Failed to submit. Please try again.');
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <button 
              onClick={() => navigate('/customer-dashboard')}
              className="flex items-center gap-2 text-[10px] font-bold text-ns-text-muted hover:text-ns-blue transition-colors uppercase tracking-widest mb-4"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ns-blue/10 rounded-sm flex items-center justify-center text-ns-blue">
                <FileCheck size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ns-navy">{form.name}</h1>
                <p className="text-xs text-ns-text-muted font-medium mt-0.5 uppercase tracking-wider">
                  Transaction ID: {form.id.substring(0, 8)} • Source: {(form.source || 'scratch').toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <Button variant="secondary" className="gap-2 h-10 px-6 font-bold text-xs uppercase tracking-widest">
               <Save size={16} /> Save Progress
             </Button>
             <Button 
                onClick={handleSubmit} 
                className="gap-2 h-10 px-8 font-bold text-xs uppercase tracking-widest bg-ns-blue border-b-4 border-b-ns-navy hover:translate-y-0.5 active:border-b-0 transition-all shadow-lg shadow-ns-blue/20"
                disabled={isSubmitting}
              >
               <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Commit Submission'}
             </Button>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 p-4 rounded-sm border border-red-200 flex gap-4 items-center">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <p className="text-xs text-red-900 font-bold">{submitError}</p>
          </div>
        )}

        {/* Security banner */}
        <div className="bg-ns-navy p-4 rounded-sm border border-ns-border flex items-center justify-between">
           <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-ns-blue" />
              <div className="text-white">
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-1">Authenticated Entry Mode</p>
                 <p className="text-xs font-medium text-white/70">Your entry is tracked for compliance. Ensure all data matches official records.</p>
              </div>
           </div>
           <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm text-[10px] font-mono text-white/50">
              SSL: AES-256
           </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-sm border border-ns-border ns-panel-shadow min-h-[500px] flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-8 bg-ns-gray-bg border-b">
              <TabsList className="bg-transparent border-none py-4">
                {form.tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent rounded-sm font-bold text-xs uppercase tracking-wider px-6 h-10 transition-all"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 p-8 overflow-auto custom-scrollbar">
              {form.tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0 space-y-12">

                  {/* Body field groups */}
                  {tab.fieldGroups.map(group => (
                    <div key={group.id} className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-ns-border pb-3">
                        <div className="w-1 h-3 bg-ns-blue rounded-full" />
                        <h3 className="text-sm font-bold text-ns-navy uppercase tracking-[0.2em]">{group.name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.fields.map(field => (
                          <div 
                            key={field.id} 
                            className={cn(
                              "space-y-1.5",
                              (field.type === 'textarea' || field.type === 'address' || field.type === 'summary') 
                                && "md:col-span-2 lg:col-span-3"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <Label mandatory={field.mandatory} className="text-[11px] font-bold uppercase tracking-wide text-ns-navy/70">
                                {field.label}
                              </Label>
                              {field.helpText && (
                                <Info size={12} className="text-ns-text-muted opacity-40 hover:opacity-100 cursor-help" title={field.helpText} />
                              )}
                            </div>
                            <FieldControl
                              fieldType={field.type}
                              value={formValues[field.id]}
                              onChange={(val) => handleInputChange(field.id, val)}
                              disabled={field.displayType === 'disabled'}
                              defaultValue={field.defaultValue}
                              checkBoxDefault={field.checkBoxDefault}
                              label={field.label}
                              dataSource={field.dataSource}
                              preview={false}
                            />
                          </div>
                        ))}
                        {group.fields.length === 0 && (
                          <div className="col-span-full py-8 text-center bg-gray-50 border border-dashed rounded-sm border-gray-200">
                            <p className="text-xs text-ns-text-muted italic">No fields configured for this section.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Line Items sublist */}
                  {tab.itemSublist && tab.itemSublist.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-ns-border pb-3">
                        <div className="w-1 h-3 bg-purple-500 rounded-full" />
                        <h3 className="text-sm font-bold text-ns-navy uppercase tracking-[0.2em]">Line Items</h3>
                      </div>
                      <div className="overflow-x-auto border border-ns-border rounded-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-ns-gray-bg border-b border-ns-border">
                              {tab.itemSublist.map(field => (
                                <th key={field.id} className="px-3 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider whitespace-nowrap">
                                  {field.label}{field.mandatory && <span className="text-red-500 ml-1">*</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-ns-border">
                              {tab.itemSublist.map(field => (
                                <td key={field.id} className="px-2 py-2 min-w-[120px]">
                                  <FieldControl
                                    fieldType={field.type}
                                    value={formValues[`item_0_${field.id}`]}
                                    onChange={(val) => handleInputChange(`item_0_${field.id}`, val)}
                                    label={field.label}
                                    dataSource={field.dataSource}
                                    preview={false}
                                  />
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Expenses sublist */}
                  {tab.expenseSublist && tab.expenseSublist.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-ns-border pb-3">
                        <div className="w-1 h-3 bg-amber-500 rounded-full" />
                        <h3 className="text-sm font-bold text-ns-navy uppercase tracking-[0.2em]">Expenses</h3>
                      </div>
                      <div className="overflow-x-auto border border-ns-border rounded-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-ns-gray-bg border-b border-ns-border">
                              {tab.expenseSublist.map(field => (
                                <th key={field.id} className="px-3 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider whitespace-nowrap">
                                  {field.label}{field.mandatory && <span className="text-red-500 ml-1">*</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-ns-border">
                              {tab.expenseSublist.map(field => (
                                <td key={field.id} className="px-2 py-2 min-w-[120px]">
                                  <FieldControl
                                    fieldType={field.type}
                                    value={formValues[`exp_0_${field.id}`]}
                                    onChange={(val) => handleInputChange(`exp_0_${field.id}`, val)}
                                    label={field.label}
                                    dataSource={field.dataSource}
                                    preview={false}
                                  />
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        {/* Compliance footer */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm flex gap-4 items-center">
           <AlertCircle className="text-amber-600 shrink-0" size={20} />
           <p className="text-[11px] text-amber-900 leading-relaxed font-semibold italic">
             Important: Submission constitutes a legally binding acknowledgment. Once transmitted, further editing requires administrative override.
           </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
