import apiClient, { type ApiResponse } from './api';

export interface ContactPayload {
  fullName: string;
  email: string;
  phoneNumber?: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  subject: string;
  message: string;
  status: 'PENDING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export const ContactService = {
  submitContact: async (data: ContactPayload) => {
    const response = await apiClient.post<ApiResponse<ContactResponse>>('/contacts', data);
    return response.data as ContactResponse;
  },

  getAdminContacts: async (params?: { status?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/contacts', { params });
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await apiClient.patch<ApiResponse<ContactResponse>>(`/admin/contacts/${id}/status`, null, {
      params: { status },
    });
    return response.data as ContactResponse;
  },
};

export default ContactService;
