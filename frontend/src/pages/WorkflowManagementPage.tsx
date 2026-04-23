import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Label } from '../components/ui/Base';
import { workflowApi, WorkflowLevel, Approver } from '../api/workflow';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  Users, 
  ArrowLeft, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  X, 
  CheckCircle2,
  AlertCircle,
  GripVertical
} from 'lucide-react';

export default function WorkflowManagementPage() {
  const { companyId: paramCompanyId } = useParams();
  const navigate = useNavigate();
  const { user, companies, users, fetchCompanies, fetchUsers } = useStore();
  
  // Scoping: Use param or current user's company
  const companyId = paramCompanyId || user?.companyId;
  const isSuperAdmin = user?.role === 'super_admin';

  const [workflowName, setWorkflowName] = React.useState('Standard Approval Workflow');
  const [levels, setLevels] = React.useState<WorkflowLevel[]>([
    { level: 1, approvers: [] }
  ]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const company = companies.find(c => c.id === companyId);
  const companyEmployees = users.filter(u => u.companyId === companyId);

  React.useEffect(() => {
    const loadData = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        await Promise.all([fetchCompanies(), fetchUsers()]);
        
        try {
          const existingWorkflow = await workflowApi.getWorkflowByCompany(companyId);
          if (existingWorkflow) {
            setWorkflowName(existingWorkflow.name);
            setLevels(existingWorkflow.levels);
          }
        } catch (err) {
          // Workflow might not exist yet, which is fine
          console.log('No existing workflow found or error fetching it');
        }
      } catch (error) {
        showNotification('Failed to load workflow data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [companyId, fetchCompanies, fetchUsers]);

  if (!company && !isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-ns-text-muted">Entity not found.</p>
          <Button variant="secondary" onClick={() => navigate('/companies')} className="mt-4">Return to Directory</Button>
        </div>
      </AdminLayout>
    );
  }

  const handleAddLevel = () => {
    const nextLevel = levels.length + 1;
    setLevels([...levels, { level: nextLevel, approvers: [] }]);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length === 1) {
      showNotification('Workflow must have at least one level', 'error');
      return;
    }
    const newLevels = levels.filter((_, i) => i !== index).map((level, i) => ({
      ...level,
      level: i + 1
    }));
    setLevels(newLevels);
  };

  const handleAddApprover = (levelIndex: number, userId: string) => {
    const employee = companyEmployees.find(u => u.id === userId);
    if (!employee) return;

    // Check if already added to this level
    if (levels[levelIndex].approvers.some(a => a.userId === userId)) {
      showNotification('User already assigned to this level', 'error');
      return;
    }

    const newLevels = [...levels];
    newLevels[levelIndex].approvers.push({
      userId: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.jobTitle || 'Employee'
    });
    setLevels(newLevels);
  };

  const handleRemoveApprover = (levelIndex: number, userId: string) => {
    const newLevels = [...levels];
    newLevels[levelIndex].approvers = newLevels[levelIndex].approvers.filter(a => a.userId !== userId);
    setLevels(newLevels);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      showNotification('Please enter a workflow name', 'error');
      return;
    }

    if (levels.some(l => l.approvers.length === 0)) {
      showNotification('Each level must have at least one approver', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await workflowApi.saveWorkflow({
        companyId: companyId!,
        name: workflowName,
        levels: levels
      });
      showNotification('Workflow configuration saved successfully', 'success');
    } catch (error: any) {
      showNotification(error.response?.data?.detail || 'Failed to save workflow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === levels.length - 1) return;

    const newLevels = [...levels];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newLevels[index], newLevels[swapIndex]] = [newLevels[swapIndex], newLevels[index]];
    
    // Re-index
    const reindexed = newLevels.map((l, i) => ({ ...l, level: i + 1 }));
    setLevels(reindexed);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ns-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col gap-4">
          {isSuperAdmin && (
            <button 
              onClick={() => navigate('/companies')}
              className="flex items-center gap-2 text-xs font-bold text-ns-text-muted hover:text-ns-blue transition-colors uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Back to Directory
            </button>
          )}
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-sm bg-ns-blue text-white flex items-center justify-center font-bold text-2xl shadow-xl">
                <GitBranch size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-ns-blue mb-1">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Workflow Configuration Engine</span>
                </div>
                <h1 className="text-3xl font-bold text-ns-text">Approval Routing</h1>
                <p className="text-sm text-ns-text-muted mt-1">
                  Define multi-level hierarchy for transaction authorization for <span className="text-ns-navy font-bold">{company?.name}</span>.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSaveWorkflow} 
              disabled={isSaving}
              className="gap-2 px-8 h-10 bg-ns-navy hover:bg-ns-navy/90 text-white shadow-lg shadow-ns-navy/20"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {isSaving ? 'Processing...' : 'Save Configuration'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Config */}
          <div className="col-span-8 space-y-6">
            {/* Step 1: Name */}
            <div className="bg-white p-6 border border-ns-border rounded-sm ns-panel-shadow space-y-4">
              <div className="flex items-center gap-2 border-b border-ns-border pb-3 mb-4">
                <div className="w-6 h-6 bg-ns-blue text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ns-navy">Workflow Metadata</h2>
              </div>
              <div>
                <Label mandatory>Workflow Strategy Name</Label>
                <Input 
                  placeholder="e.g. Purchase Order Approval Workflow" 
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="h-10 text-lg font-semibold"
                />
                <p className="text-[10px] text-ns-text-muted mt-1.5 italic">This name will identify the approval process in system logs and notifications.</p>
              </div>
            </div>

            {/* Step 2: Levels */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-ns-blue text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-ns-navy">Approval Hierarchy</h2>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleAddLevel}
                  className="h-8 px-4 gap-1.5 text-[10px] font-bold uppercase tracking-widest border-ns-blue text-ns-blue hover:bg-ns-blue hover:text-white transition-all"
                >
                  <Plus size={14} /> Add Level
                </Button>
              </div>

              <div className="space-y-4">
                {levels.map((level, idx) => (
                  <div key={idx} className="bg-white border border-ns-border rounded-sm ns-panel-shadow overflow-hidden group">
                    <div className="bg-ns-gray-bg border-b border-ns-border px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-ns-text-muted cursor-move" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ns-blue">Level {level.level}</span>
                        {idx === 0 && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Initial Review</span>}
                        {idx === levels.length - 1 && idx > 0 && <span className="text-[8px] bg-ns-navy/10 text-ns-navy px-1.5 py-0.5 rounded-full font-bold uppercase">Final Authorization</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-ns-text-muted hover:bg-ns-border"
                          onClick={() => moveLevel(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <ChevronUp size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-ns-text-muted hover:bg-ns-border"
                          onClick={() => moveLevel(idx, 'down')}
                          disabled={idx === levels.length - 1}
                        >
                          <ChevronDown size={14} />
                        </Button>
                        <div className="w-px h-4 bg-ns-border mx-1" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-400 hover:bg-red-50"
                          onClick={() => handleRemoveLevel(idx)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="mb-4">
                        <Label>Assign Approvers for this Level</Label>
                        <div className="flex gap-2 mt-1.5">
                          <select 
                            className="flex-1 h-9 rounded-sm border border-ns-border bg-white px-3 text-xs focus:ring-1 focus:ring-ns-blue outline-none"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddApprover(idx, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">Search and select employees...</option>
                            {companyEmployees
                              .filter(emp => !level.approvers.some(a => a.userId === emp.id))
                              .map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.jobTitle || 'Employee'})
                                </option>
                              ))
                            }
                          </select>
                          <div className="h-9 w-9 bg-ns-gray-bg border border-ns-border flex items-center justify-center text-ns-text-muted rounded-sm">
                            <Users size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">Designated Authorized Personnel:</p>
                        {level.approvers.length === 0 ? (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm text-red-600">
                            <AlertCircle size={14} />
                            <span className="text-[11px] font-medium italic">Requirement Warning: At least one approver must be assigned to validate this level.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {level.approvers.map(approver => (
                              <div key={approver.userId} className="flex items-center justify-between p-2 bg-ns-gray-bg border border-ns-border rounded-sm group/item hover:border-ns-blue/30 transition-all">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-ns-navy/10 text-ns-navy flex items-center justify-center text-[10px] font-black uppercase">
                                    {approver.name.substring(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-ns-text leading-none">{approver.name}</span>
                                    <span className="text-[9px] text-ns-text-muted">{approver.role}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleRemoveApprover(idx, approver.userId)}
                                  className="p-1 text-ns-text-muted hover:text-red-500 hover:bg-red-50 rounded-sm"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Overview */}
          <div className="col-span-4 space-y-6">
            <div className="bg-ns-navy p-6 rounded-sm text-white space-y-6 shadow-2xl">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-4">Workflow Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] text-white/60">Total Levels</span>
                    <span className="text-xl font-bold">{levels.length} Stages</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] text-white/60">Total Approvers</span>
                    <span className="text-xl font-bold">
                      {levels.reduce((acc, l) => acc + l.approvers.length, 0)} Personnel
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-sm border border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <GitBranch size={12} className="text-ns-blue" />
                  Logic Overview
                </h4>
                <div className="space-y-3">
                  {levels.map((l, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${l.approvers.length > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                        {i < levels.length - 1 && <div className="w-px h-6 bg-white/10 my-1" />}
                      </div>
                      <div className="flex flex-col -mt-1">
                        <span className="text-[10px] font-bold">Level {l.level}</span>
                        <span className="text-[9px] text-white/40 italic">
                          {l.approvers.length === 0 ? 'Unconfigured' : `${l.approvers.length} Signatories`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[9px] leading-relaxed text-amber-200/80">
                    Configuration changes take effect immediately for all new transaction submissions. Existing pending transactions will follow the legacy workflow.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border border-ns-border rounded-sm ns-panel-shadow">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ns-navy mb-4">Quick Reference</h3>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ns-blue mt-1.5 shrink-0" />
                  <p className="text-[10px] text-ns-text-muted leading-tight">
                    <strong>Any Approver:</strong> Any single user assigned to a level can approve to move the transaction to the next stage.
                  </p>
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ns-blue mt-1.5 shrink-0" />
                  <p className="text-[10px] text-ns-text-muted leading-tight">
                    <strong>Sequential Routing:</strong> Transactions always flow from Level 1 upwards.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-20 right-6 z-[100] ${notification.type === 'success' ? 'bg-ns-navy' : 'bg-red-600'} text-white px-6 py-3 rounded-sm shadow-2xl border-l-4 ${notification.type === 'success' ? 'border-ns-blue' : 'border-red-400'} animate-in fade-in slide-in-from-right-4 duration-300 flex items-center gap-3`}>
            <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-ns-blue' : 'bg-white'} animate-pulse`} />
            <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
