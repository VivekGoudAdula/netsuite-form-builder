import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Label, Input } from '../components/ui/Base';
import { Tabs, Modal } from '../components/ui/Complex';
import { ChevronLeft, Printer, Mail, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { FieldControl } from '../components/ui/FieldControl';
import { sortItemSublistFields } from '../lib/netsuiteMasterData';

export default function PreviewPage() {
  const { currentForm, catalogues } = useStore();
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = React.useState(currentForm?.tabs[0]?.id || '');
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'info' } | null>(null);

  if (!currentForm) return null;

  const activeTab = currentForm.tabs.find(t => t.id === activeTabId);
  const catalogue = catalogues[currentForm.transactionType];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(currentForm, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${currentForm.name.replace(/\s+/g, '_')}_config.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setNotification({ message: 'Configuration exported successfully', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailModalOpen(false);
    setNotification({ message: 'Email sent successfully to recipients', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-ns-gray-bg flex flex-col print:bg-white">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-[100] bg-ns-navy text-white px-6 py-3 rounded-sm shadow-2xl border-l-4 border-ns-blue animate-in fade-in slide-in-from-right-4 duration-300 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-ns-blue animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* Email Modal */}
      <Modal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        title="Email Form Configuration"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleEmailSubmit}>Send Email</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleEmailSubmit}>
          <div>
            <Label mandatory>Recipient Email</Label>
            <Input placeholder="admin@example.com" type="email" required />
          </div>
          <div>
            <Label>Subject</Label>
            <Input defaultValue={`Form Configuration: ${currentForm.name}`} />
          </div>
          <div>
            <Label>Message</Label>
            <textarea 
              className="w-full text-xs p-2 border border-ns-border rounded-sm focus:outline-none focus:ring-ns-blue/10 min-h-[100px] bg-white text-ns-text"
              placeholder="Add an optional message..."
            />
          </div>
        </form>
      </Modal>

      {/* Top Bar */}
      <header className="bg-white border-b border-ns-border px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm print:hidden">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" onClick={() => navigate('/builder')} className="hover:bg-gray-100">
            <ChevronLeft size={20} />
          </Button>
          <div className="h-8 w-[1px] bg-ns-border" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ns-text leading-tight">{catalogue.name}</h1>
              <span className="px-2 py-0.5 bg-ns-light-blue text-ns-blue text-[10px] font-bold rounded-sm uppercase tracking-wider">Preview Mode</span>
            </div>
            <p className="text-[11px] text-ns-text-muted font-medium uppercase tracking-widest mt-0.5">Configuration: {currentForm.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 mr-4">
            <Button variant="secondary" size="sm" className="gap-2" onClick={handlePrint}><Printer size={14} /> Print</Button>
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => setIsEmailModalOpen(true)}><Mail size={14} /> Email</Button>
            <Button variant="secondary" size="sm" className="gap-2" onClick={handleExport}><Share2 size={14} /> Export</Button>
          </div>
          
          <div className="relative">
            <Button 
              variant="secondary" 
              size="sm" 
              className={cn("p-2 transition-colors", showMoreMenu && "bg-gray-100")}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <MoreHorizontal size={16} />
            </Button>
            
            {showMoreMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowMoreMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-ns-border rounded-sm shadow-xl z-40 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.15em] border-b border-gray-50 mb-1">More Actions</div>
                  {[
                    { label: 'View Audit Trail', icon: MoreHorizontal },
                    { label: 'System Information', icon: MoreHorizontal },
                    { label: 'Permissions Setup', icon: MoreHorizontal },
                    { label: 'Clone Configuration', icon: MoreHorizontal }
                  ].map((item, idx) => (
                    <button 
                      key={idx}
                      className="w-full text-left px-4 py-2.5 text-[11px] text-ns-text hover:bg-ns-light-blue/40 transition-colors flex items-center justify-between group"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setNotification({ message: `${item.label} requested`, type: 'info' });
                        setTimeout(() => setNotification(null), 2000);
                      }}
                    >
                      {item.label}
                      <div className="w-1 h-1 rounded-full bg-ns-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="w-[1px] h-6 bg-ns-border mx-2" />
          <Button size="sm" className="px-8" onClick={() => navigate('/dashboard')}>Save & Close</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="space-y-8">
          {/* Dynamic Tabs & Sections */}
          <div className="bg-white rounded-sm shadow-sm border border-ns-border overflow-hidden">
            <Tabs 
              tabs={currentForm.tabs.map(t => ({ id: t.id, label: t.name }))} 
              activeTab={activeTabId} 
              onChange={setActiveTabId} 
            />
            
            <div className="p-8">
              {activeTab?.fieldGroups.map(group => (
                <div key={group.id} className="mb-12 last:mb-0">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] whitespace-nowrap">
                      {group.name}
                    </h3>
                    <div className="h-[1px] bg-gray-100 w-full" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                    {group.fields.filter(f => f.visible && f.displayType !== 'hidden').map(field => (
                      <div key={field.id} className={cn("group", field.layout?.columnBreak && "col-start-2")}>
                        <div className="flex justify-between items-center mb-1.5">
                          <Label mandatory={field.mandatory} helpText={field.helpText} className="mb-0">
                            {field.label}
                          </Label>
                          {field.displayType === 'disabled' && (
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest pl-2">Read Only</span>
                          )}
                        </div>
                        <FieldControl
                          fieldType={field.type}
                          disabled={field.displayType === 'disabled'}
                          defaultValue={field.defaultValue}
                          checkBoxDefault={field.checkBoxDefault}
                          label={field.label}
                          preview={false}
                          showIntegrationHints={false}
                          dataSource={field.dataSource}
                        />
                        {field.layout?.spaceBefore && <div className="mt-4" />}
                      </div>
                    ))}
                    </div>
                  </div>
                ))}

              {/* Sublist Rendering */}
              {activeTab?.itemSublist && activeTab.itemSublist.length > 0 && (
                <div className="mt-12 backdrop-blur-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] whitespace-nowrap">
                      Itemized Line Details
                    </h3>
                    <div className="h-[1px] bg-ns-blue/10 w-full" />
                  </div>
                  
                  <div className="border border-ns-border rounded-sm overflow-hidden bg-ns-gray-bg/50">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-ns-navy text-white">
                          {sortItemSublistFields(activeTab.itemSublist).map(field => (
                            <th key={field.id} className="p-3 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-0">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2].map((row) => (
                          <tr key={row} className="border-b border-ns-border bg-white last:border-0 group hover:bg-ns-light-blue/20 transition-colors">
                            {sortItemSublistFields(activeTab.itemSublist!).map(field => (
                              <td key={field.id} className="p-3 border-r border-ns-border last:border-0">
                                <FieldControl
                                  fieldType={field.type}
                                  disabled={field.displayType === 'disabled'}
                                  label={field.label}
                                  preview={true}
                                  showIntegrationHints={false}
                                  dataSource={field.dataSource}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab?.expenseSublist && activeTab.expenseSublist.length > 0 && (
                <div className="mt-12">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] whitespace-nowrap">
                      Corporate Expense Ledger
                    </h3>
                    <div className="h-[1px] bg-ns-blue/10 w-full" />
                  </div>
                  
                  <div className="border border-ns-border rounded-sm overflow-hidden bg-ns-gray-bg/50">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-ns-navy text-white">
                          {activeTab.expenseSublist.map(field => (
                            <th key={field.id} className="p-3 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-0">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1].map((row) => (
                          <tr key={row} className="border-b border-ns-border bg-white last:border-0 hover:bg-ns-light-blue/20 transition-colors">
                            {activeTab.expenseSublist!.map(field => (
                              <td key={field.id} className="p-3 border-r border-ns-border last:border-0">
                                <FieldControl
                                  fieldType={field.type}
                                  disabled={field.displayType === 'disabled'}
                                  label={field.label}
                                  preview={true}
                                  showIntegrationHints={false}
                                  dataSource={field.dataSource}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(!activeTab || (activeTab.fieldGroups.length === 0 && (!activeTab.itemSublist || activeTab.itemSublist.length === 0) && (!activeTab.expenseSublist || activeTab.expenseSublist.length === 0))) && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                  <Share2 size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">No fields configured for this view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
