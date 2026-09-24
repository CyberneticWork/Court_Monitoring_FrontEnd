import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);

  clients = signal<any[]>([]);
  attorneys = signal<any[]>([]);
  selectedClientId = signal<string>('');
  selectedClient = signal<any>(null);
  
  // Tab: 'all' | 'corporate' | 'individual'
  activeTab = signal<'all' | 'corporate' | 'individual'>('all');

  searchQuery = '';
  typeFilter = '';
  statusFilter = '';

  currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  showAddModal = signal(false);
  showAppointmentModal = signal(false);
  duplicateWarning = signal<string | null>(null);

  newClient: any = {
    type: 'INDIVIDUAL',
    name: '',
    nicOrPassport: '',
    phone: '',
    email: '',
    address: '',
    preferredContactMethod: 'PHONE',
    notes: ''
  };

  newAppointment: any = {
    clientId: '',
    clientName: '',
    clientPhone: '',
    attorneyId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    purpose: '',
    type: 'INITIAL_CONSULTATION'
  };

  ngOnInit() {
    this.loadClients();
    this.loadAttorneys();
  }

  loadClients() {
    this.apiService.getClients({
      search: this.searchQuery,
      type: this.typeFilter,
      status: this.statusFilter
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.clients.set(res.clients || []);
          if (res.clients?.length > 0) {
            if (!this.selectedClientId()) {
              this.selectedClientId.set(res.clients[0].id);
              this.fetchFullClient(res.clients[0].id);
            }
          }
        }
      },
      error: (err) => console.error('Failed to load clients:', err)
    });
  }

  loadAttorneys() {
    this.apiService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          const list = res.users || [];
          this.attorneys.set(list);
          if (list.length > 0 && !this.newAppointment.attorneyId) {
            const currentUser = this.authService.currentUser();
            const match = list.find((a: any) => a.id === currentUser?.id);
            this.newAppointment.attorneyId = match ? match.id : list[0].id;
          }
        }
      },
      error: (err) => console.error('Failed to load attorneys:', err)
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'CL').toUpperCase();
  }

  selectClient(client: any) {
    if (!client) return;
    this.selectedClientId.set(client.id);
    this.fetchFullClient(client.id);
  }

  fetchFullClient(id: string) {
    if (!id) {
      this.selectedClient.set(null);
      return;
    }
    this.apiService.getClient(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedClient.set(res.client);
        } else {
          const found = this.clients().find(c => c.id === id);
          this.selectedClient.set(found || null);
        }
      },
      error: () => {
        // Fallback to list item
        const found = this.clients().find(c => c.id === id);
        this.selectedClient.set(found || null);
      }
    });
  }

  // Filtered Clients based on search, filter, and tab
  filteredClients = computed(() => {
    const list = this.clients();
    const tab = this.activeTab();
    const q = this.searchQuery.toLowerCase().trim();
    const status = this.statusFilter;
    const type = this.typeFilter;

    return list.filter(c => {
      if (tab === 'corporate' && c.type !== 'CORPORATE') return false;
      if (tab === 'individual' && c.type !== 'INDIVIDUAL') return false;
      if (type && c.type !== type) return false;
      if (status && c.status !== status) return false;
      if (q) {
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchNum = (c.clientNumber || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchNic = (c.nicOrPassport || '').toLowerCase().includes(q);
        const matchCompany = (c.companyName || '').toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchPhone && !matchEmail && !matchNic && !matchCompany) {
          return false;
        }
      }
      return true;
    });
  });

  corporateClientsCount = computed(() => {
    return this.clients().filter(c => c.type === 'CORPORATE').length;
  });

  individualClientsCount = computed(() => {
    return this.clients().filter(c => c.type === 'INDIVIDUAL').length;
  });

  totalMattersCount = computed(() => {
    return this.clients().reduce((acc, c) => acc + (c._count?.matters || c.matters?.length || 0), 0);
  });

  openAddModal() {
    this.duplicateWarning.set(null);
    this.newClient = {
      type: 'INDIVIDUAL',
      name: '',
      nicOrPassport: '',
      phone: '',
      email: '',
      address: '',
      preferredContactMethod: 'PHONE',
      notes: ''
    };
    this.showAddModal.set(true);
  }

  openAppointmentModal() {
    if (this.attorneys().length === 0) {
      this.loadAttorneys();
    }
    if (this.selectedClient()) {
      this.newAppointment.clientId = this.selectedClient().id;
      this.newAppointment.clientName = this.selectedClient().name;
      this.newAppointment.clientPhone = this.selectedClient().phone;
    }
    if (!this.newAppointment.attorneyId && this.attorneys().length > 0) {
      const currentUser = this.authService.currentUser();
      const match = this.attorneys().find((a: any) => a.id === currentUser?.id);
      this.newAppointment.attorneyId = match ? match.id : this.attorneys()[0].id;
    }
    this.showAppointmentModal.set(true);
  }

  closeModals() {
    this.showAddModal.set(false);
    this.showAppointmentModal.set(false);
    this.duplicateWarning.set(null);
  }

  saveClient(force = false) {
    this.apiService.createClient(this.newClient, force).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModals();
          this.loadClients();
        }
      },
      error: (err) => {
        if (err.status === 409 && err.error?.duplicateClient) {
          this.duplicateWarning.set(err.error.message);
        } else {
          alert(err.error?.message || 'Failed to save client.');
        }
      }
    });
  }

  saveAppointment() {
    this.apiService.createAppointment(this.newAppointment).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModals();
          if (this.selectedClientId()) {
            this.fetchFullClient(this.selectedClientId());
          }
          alert('Consultation scheduled successfully.');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to schedule appointment.');
      }
    });
  }
}
