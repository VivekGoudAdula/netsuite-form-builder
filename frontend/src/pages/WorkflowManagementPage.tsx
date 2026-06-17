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
import { PageHeader, Card, StatusBadge } from '../components/admin';

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
            showNotification('Existing workflow loaded', 'success');
          } else {
            showNotification('No active workflow found. Starting fresh configuration.', 'info');
          }
        } catch (err) {
          showNotification('Ready for initial workflow configuration.', 'info');
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
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-status-rejected-bg rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ns-navy">Company not found</h2>
            <p className="text-ns-text-muted mt-1 max-w-xs mx-auto">We could not find the company for this workflow.</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => navigate(isSuperAdmin ? '/companies' : '/dashboard')} 
            className="mt-2"
          >
            Return to {isSuperAdmin ? 'companies' : 'dashboard'}
          </Button>
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
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-4">
          {isSuperAdmin && (
            <button
              onClick={() => navigate('/companies')}
              className="flex items-center gap-2 text-xs font-medium text-ns-text-muted hover:text-ns-blue transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Back to companies
            </button>
          )}

          <PageHeader
            eyebrow="Workflow configuration"
            title="Approval routing"
            subtitle={`Set who approves each step for ${company?.name}.`}
            actions={
              <Button onClick={handleSaveWorkflow} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {isSaving ? 'Saving…' : 'Save workflow'}
              </Button>
            }
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-2 border-b border-ns-border pb-3">
                <StatusBadge variant="synced">Step 1</StatusBadge>
                <h2 className="text-sm font-semibold text-ns-text">Workflow details</h2>
              </div>
              <div>
                <Label mandatory>Workflow name</Label>
                <Input 
                  placeholder="e.g. Purchase Order Approval Workflow" 
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="h-10 text-lg font-semibold"
                />
                <p className="text-[10px] text-ns-text-muted mt-1.5 italic">This name appears in submission history and email notifications.</p>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="pending">Step 2</StatusBadge>
                  <h2 className="text-sm font-semibold text-ns-text">Approval steps</h2>
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
                  <Card key={idx} padding="none" className="overflow-hidden group">
                    <div className="bg-ns-page-bg border-b border-ns-border px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-ns-text-muted" />
                        <span className="text-xs font-semibold text-ns-blue">Level {level.level}</span>
                        {idx === 0 && <StatusBadge variant="approved">Initial review</StatusBadge>}
                        {idx === levels.length - 1 && idx > 0 && (
                          <StatusBadge variant="synced">Final approval</StatusBadge>
                        )}
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
                          className="h-7 w-7 text-red-400 hover:bg-status-rejected-bg"
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
                            className="flex-1 h-9 rounded-ns-md border border-ns-border bg-white px-3 text-xs focus:ring-1 focus:ring-ns-blue outline-none"
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
                          <div className="h-9 w-9 bg-ns-gray-bg border border-ns-border flex items-center justify-center text-ns-text-muted rounded-ns-md">
                            <Users size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">Approvers:</p>
                        {level.approvers.length === 0 ? (
                          <div className="flex items-center gap-2 p-3 bg-status-rejected-bg border border-red-100 rounded-ns-md text-status-rejected">
                            <AlertCircle size={14} />
                            <span className="text-[11px] font-medium italic">Add at least one approver for this step.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {level.approvers.map(approver => (
                              <div key={approver.userId} className="flex items-center justify-between p-2 bg-ns-gray-bg border border-ns-border rounded-ns-md group/item hover:border-ns-blue/30 transition-all">
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
                                  className="p-1 text-ns-text-muted hover:text-red-500 hover:bg-status-rejected-bg rounded-ns-md"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="bg-ns-navy text-white border-ns-navy space-y-6">
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
                      {levels.reduce((acc, l) => acc + l.approvers.length, 0)} approvers
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-ns-md border border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <GitBranch size={12} className="text-ns-blue" />
                  Summary
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
                          {l.approvers.length === 0 ? 'Not set up' : `${l.approvers.length} approver${l.approvers.length === 1 ? '' : 's'}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <div className="p-3 bg-status-pending-bg0/10 border border-amber-500/20 rounded-ns-md flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[9px] leading-relaxed text-amber-200/80">
                    Changes apply to new submissions immediately. Pending submissions keep the previous workflow.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
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
            </Card>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-20 right-6 z-[100] ${notification.type === 'success' ? 'bg-ns-navy' : 'bg-red-600'} text-white px-6 py-3 rounded-ns-md shadow-2xl border-l-4 ${notification.type === 'success' ? 'border-ns-blue' : 'border-red-400'} animate-in fade-in slide-in-from-right-4 duration-300 flex items-center gap-3`}>
            <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-ns-blue' : 'bg-white'} animate-pulse`} />
            <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
