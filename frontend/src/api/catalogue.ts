import api from './client';

export interface CatalogueField {
  _id: string;
  internalId: string;
  type: string;
  nlapiSubmitField: boolean;
  label: string;
  required: boolean;
  transactionType: string;
  isSystemField: boolean;
  section: 'body' | 'sublist';
  subSection: 'item' | 'expense' | null;
  group: string;
  tab: string;
  displayOrder: number;
  origin: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CatalogueFieldCreate = Omit<CatalogueField, '_id' | 'createdAt' | 'updatedAt'>;

export const catalogueApi = {
  getFields: (type?: string) => 
    api.get<CatalogueField[]>(`/catalogue`, { params: { type } }),
  
  createField: (data: CatalogueFieldCreate) => 
    api.post<CatalogueField>(`/catalogue`, data),
  
  updateField: (id: string, data: Partial<CatalogueFieldCreate>) => 
    api.put<CatalogueField>(`/catalogue/${id}`, data),
  
  deleteField: (id: string) => 
    api.delete(`/catalogue/${id}`),
};
