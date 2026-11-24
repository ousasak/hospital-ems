import { api } from '@/api/client';

export const payrollService = {
  getStructures: async () => (await api.get('/payroll/structures')).data,
  createStructure: async (data: any) => (await api.post('/payroll/structures', data)).data,
  getEmployeeSalaries: async (employeeId: number | string) =>
    (await api.get(`/payroll/employee-salaries/${employeeId}`)).data,
  setEmployeeSalary: async (data: any) => (await api.post('/payroll/employee-salaries', data)).data,
  getBatches: async (params?: any) => (await api.get('/payroll/batches', { params })).data,
  getBatch: async (id: number | string) => (await api.get(`/payroll/batches/${id}`)).data,
  processBatch: async (data: any) => (await api.post('/payroll/batches/process', data)).data,
  updateBatchStatus: async (id: number | string, status: string) =>
    (await api.put(`/payroll/batches/${id}/status`, { status })).data,
  getPayslip: async (id: number | string) => (await api.get(`/payroll/payslips/${id}`)).data,
};

export default payrollService;

