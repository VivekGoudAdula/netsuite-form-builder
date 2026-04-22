import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

export interface Workflow {
    id?: string;
    companyId: string;
    name: string;
    levels: WorkflowLevel[];
}

export const workflowApi = {
    getWorkflow: async (companyId: string): Promise<Workflow | null> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/workflows/${companyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    saveWorkflow: async (data: Workflow): Promise<Workflow> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/workflows`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
