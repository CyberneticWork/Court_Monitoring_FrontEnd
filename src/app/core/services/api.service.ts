import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  // ---------------- Dashboard & Reports ----------------
  getDashboardSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/summary`);
  }

  getMattersReport(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/matters`);
  }

  getFinanceReport(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/finance`);
  }

  getAttorneyWorkload(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/attorney-workload`);
  }

  // ---------------- Clients & Appointments ----------------
  getClients(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          httpParams = httpParams.set(k, params[k]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/clients`, { params: httpParams });
  }

  getClient(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/clients/${id}`);
  }

  createClient(data: any, force = false): Observable<any> {
    return this.http.post(`${this.baseUrl}/clients?force=${force}`, data);
  }

  updateClient(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/clients/${id}`, data);
  }

  deleteClient(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clients/${id}`);
  }

  getAppointments(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/appointments`, { params });
  }

  createAppointment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments`, data);
  }

  updateAppointmentStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/appointments/${id}/status`, data);
  }

  // ---------------- Matters ----------------
  getMatters(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/matters`, { params });
  }

  getMatter(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/matters/${id}`);
  }

  createMatter(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters`, data);
  }

  updateMatter(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/matters/${id}`, data);
  }

  updateMatterStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/matters/${id}/status`, data);
  }

  assignMatterStaff(matterId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters/${matterId}/assign-staff`, data);
  }

  addMatterParty(matterId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters/${matterId}/parties`, data);
  }

  // ---------------- Courts, Cases & Hearings ----------------
  getCourts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/courts`);
  }

  createCourt(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/courts`, data);
  }

  getCourtCases(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/court-cases`, { params });
  }

  createCourtCase(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/court-cases`, data);
  }

  getHearings(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/hearings`, { params });
  }

  scheduleHearing(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/hearings`, data);
  }

  recordHearingOutcome(hearingId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/hearings/${hearingId}/outcome`, data);
  }

  // ---------------- Documents & Physical Custody ----------------
  getMatterDocuments(matterId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/matters/${matterId}/documents`);
  }

  uploadDocument(matterId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters/${matterId}/documents`, formData);
  }

  uploadDocumentVersion(documentId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents/${documentId}/versions`, formData);
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}`);
  }

  getPhysicalDocuments(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/physical-documents`, { params });
  }

  registerPhysicalDocument(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/physical-documents`, data);
  }

  returnPhysicalDocument(id: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/physical-documents/${id}/return`, data);
  }

  // ---------------- Tasks ----------------
  getTasks(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/tasks`, { params });
  }

  getDueTodayTasks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/tasks/due-today`);
  }

  getDueThisWeekTasks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/tasks/due-this-week`);
  }

  getOverdueTasks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/tasks/overdue`);
  }

  createTask(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/tasks`, data);
  }

  updateTaskStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/tasks/${id}/status`, data);
  }

  assignTask(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/tasks/${id}/assign`, data);
  }

  // ---------------- Master Calendar ----------------
  getCalendarEvents(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/calendar`, { params });
  }

  createCalendarEvent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/calendar/events`, data);
  }

  checkCalendarClashes(attorneyId: string, date: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/calendar/clashes`, { params: { attorneyId, date } });
  }

  // ---------------- Communications ----------------
  getMatterCommunications(matterId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/matters/${matterId}/communications`);
  }

  createMatterCommunication(matterId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters/${matterId}/communications`, data);
  }

  // ---------------- Billing, Invoices & Payments ----------------
  getMatterFees(matterId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/matters/${matterId}/fees`);
  }

  createMatterFee(matterId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters/${matterId}/fees`, data);
  }

  getMatterExpenses(matterId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/matters/${matterId}/expenses`);
  }

  createMatterExpense(matterId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/matters/${matterId}/expenses`, data);
  }

  getInvoices(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/invoices`, { params });
  }

  getInvoice(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/invoices/${id}`);
  }

  createInvoice(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/invoices`, data);
  }

  updateInvoiceStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/invoices/${id}/status`, data);
  }

  recordPayment(invoiceId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/invoices/${invoiceId}/payments`, data);
  }

  getPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payments`);
  }

  // ---------------- Users, Settings & Audit ----------------
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, data);
  }

  getRoles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/roles`);
  }

  getPermissions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/permissions`);
  }

  getSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/settings`, { settings });
  }

  getAuditLogs(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/audit-logs`, { params });
  }
}
