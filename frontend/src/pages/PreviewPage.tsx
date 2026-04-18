import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Select, Label, Checkbox } from '../components/ui/Base';
import { Tabs, Modal } from '../components/ui/Complex';
import { ChevronLeft, Printer, Mail, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

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
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full flex gap-8">
        <div className="flex-1 space-y-8">
          {/* Header Info Card */}
          <div className="bg-white p-8 rounded-sm shadow-sm border border-ns-border grid grid-cols-3 gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-ns-blue h-full" />
            
            <div className="space-y-6">
              <section>
                <Label className="text-ns-blue/60">Primary Entity</Label>
                <div className="text-base font-bold text-ns-navy">ABC Global Supplies Ltd.</div>
                <div className="text-xs text-ns-text-muted mt-1 leading-relaxed">
                  123 Business Park, Sector 45<br />
                  Gurugram, Haryana 122003<br />
                  India
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <Label className="text-ns-blue/60">Transaction Date</Label>
                  <div className="text-sm font-semibold">April 15, 2026</div>
                </div>
                <div>
                  <Label className="text-ns-blue/60">Document Number</Label>
                  <div className="text-sm font-mono font-bold text-ns-blue">PUR-ORD-2026-00421</div>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-gray-50/50 p-4 rounded-sm border border-gray-100">
              <div>
                <Label className="text-ns-blue/60">Approval Status</Label>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pending Approval
                </div>
              </div>
              <div>
                <Label className="text-ns-blue/60">Total Amount</Label>
                <div className="text-3xl font-black text-ns-navy tracking-tight">$1,250.00</div>
                <div className="text-[10px] text-ns-text-muted font-bold uppercase mt-1">Currency: USD</div>
              </div>
            </div>
          </div>

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
                      <div key={field.id} className={cn("group", field.layout.columnBreak && "col-start-2")}>
                        <div className="flex justify-between items-center mb-1.5">
                          <Label mandatory={field.mandatory} helpText={field.helpText} className="mb-0">{field.label}</Label>
                          {/* Metadata badge hidden unless relevant */}
                          {field.displayType === 'disabled' && (
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest pl-2 mb-1.5">Read Only</span>
                          )}
                        </div>
                        
                        {field.displayType === 'disabled' ? (
                          <div className="h-9 bg-gray-50 border border-ns-border/50 rounded-sm px-3 flex items-center text-sm text-ns-text-muted font-medium italic">
                            {field.defaultValue || 'No data provided'}
                          </div>
                        ) : (
                          <div className="relative">
                            {field.type === 'RecordRef' || field.type === 'select' ? (
                              <Select 
                                className="h-9"
                                options={[{ label: field.defaultValue || 'Select an option...', value: '' }]} 
                              />
                            ) : field.type === 'boolean' || field.type === 'checkbox' ? (
                              <div className="h-9 flex items-center gap-3 bg-white border border-ns-border rounded-sm px-3">
                                <Checkbox checked={field.checkBoxDefault === 'checked'} readOnly />
                                <span className="text-xs text-ns-text-muted italic">Value: {field.checkBoxDefault}</span>
                              </div>
                            ) : (
                              <Input 
                                className="h-9"
                                defaultValue={field.defaultValue} 
                                placeholder={`Enter ${field.label.toLowerCase()}...`} 
                                type={field.type === 'double' ? 'number' : field.type === 'dateTime' ? 'date' : 'text'}
                              />
                            )}
                          </div>
                        )}
                        
                        {field.layout.spaceBefore && <div className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!activeTab || activeTab.fieldGroups.length === 0) && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                  <Share2 size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">No fields configured for this view</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <aside className="w-80 space-y-8">
          <div className="bg-ns-navy p-8 rounded-sm shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ns-blue/10 rounded-full -mr-16 -mt-16" />
            
            <h3 className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] border-b border-white/10 pb-3 mb-6">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Subtotal</span>
                <span className="font-bold">$1,200.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Tax (GST 5%)</span>
                <span className="font-bold">$50.00</span>
              </div>
              <div className="h-[1px] bg-white/10 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-ns-blue uppercase tracking-widest">Total Amount</span>
                <span className="text-2xl font-black tracking-tight">$1,250.00</span>
              </div>
            </div>
            <Button className="w-full mt-8 bg-ns-blue border-none hover:bg-ns-blue/80 h-10">Submit Transaction</Button>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm border border-ns-border">
            <h3 className="text-[10px] font-bold text-ns-text uppercase tracking-[0.2em] border-b border-gray-100 pb-3 mb-5">Classification</h3>
            <div className="space-y-5">
              <div>
                <Label className="text-ns-blue/60">Subsidiary</Label>
                <div className="text-xs font-semibold text-ns-text">Parent Company : India Subsidiary</div>
              </div>
              <div>
                <Label className="text-ns-blue/60">Department</Label>
                <div className="text-xs font-semibold text-ns-text">Sales & Marketing Operations</div>
              </div>
              <div>
                <Label className="text-ns-blue/60">Class</Label>
                <div className="text-xs font-semibold text-ns-text">Direct Sales : Enterprise</div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
