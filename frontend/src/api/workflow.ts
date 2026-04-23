import API from './client';

export interface Approver {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface WorkflowLevel {
  level: number;
  approvers: Approver[];
}

export interface WorkflowRequest {
  companyId: string;
  name: string;
  levels: WorkflowLevel[];
}

export interface WorkflowResponse {
  id: string;
  companyId: string;
  name: string;
  levels: WorkflowLevel[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowApi = {
  saveWorkflow: async (data: WorkflowRequest) => {
    const response = await API.post('/workflows', data);
    return response.data;
  },
  
  getWorkflowByCompany: async (companyId: string): Promise<WorkflowResponse> => {
    const response = await API.get(`/workflows/${companyId}`);
    return response.data;
  },
};
