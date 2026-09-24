import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);

  // Live Summary from Backend
  summary = signal<any>(null);

  // Live Database Collections
  liveHearings = signal<any[]>([]);
  liveTasks = signal<any[]>([]);
  liveMatters = signal<any[]>([]);
  liveInvoices = signal<any[]>([]);

  // Active Tab: 'hearings' | 'tasks' | 'matters' | 'invoices'
  activeTab = signal<'hearings' | 'tasks' | 'matters' | 'invoices'>('hearings');

  // Selected Item for active tab
  selectedHearingId = signal<string>('');
  selectedTaskId = signal<string>('');
  selectedMatterId = signal<string>('');
  selectedInvoiceId = signal<string>('');

  // Filters & Search
  searchQuery = signal<string>('');
  selectedClientFilter = signal<string>('All');
  selectedStatusFilter = signal<string>('All');

  currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // 1. Fetch Dashboard Summary
    this.apiService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.summary);

          if (res.upcomingHearings && res.upcomingHearings.length > 0) {
            this.liveHearings.set(res.upcomingHearings);
            this.selectedHearingId.set(res.upcomingHearings[0].id);
          }

          if (res.urgentTasks && res.urgentTasks.length > 0) {
            this.liveTasks.set(res.urgentTasks);
            this.selectedTaskId.set(res.urgentTasks[0].id);
          }

          if (res.recentMatters && res.recentMatters.length > 0) {
            this.liveMatters.set(res.recentMatters);
            this.selectedMatterId.set(res.recentMatters[0].id);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load dashboard summary:', err);
      }
    });

    // 2. Fetch Full Matters list if needed
    this.apiService.getMatters().subscribe({
      next: (res) => {
        if (res.success && res.matters && res.matters.length > 0) {
          this.liveMatters.set(res.matters);
          if (!this.selectedMatterId()) {
            this.selectedMatterId.set(res.matters[0].id);
          }
        }
      },
      error: (err) => console.error('Failed to load matters:', err)
    });

    // 3. Fetch Full Invoices list
    this.apiService.getInvoices().subscribe({
      next: (res) => {
        if (res.success && res.invoices && res.invoices.length > 0) {
          this.liveInvoices.set(res.invoices);
          this.selectedInvoiceId.set(res.invoices[0].id);
        }
      },
      error: (err) => console.error('Failed to load invoices:', err)
    });

    // 4. Fetch Full Hearings list
    this.apiService.getHearings().subscribe({
      next: (res) => {
        if (res.success && res.hearings && res.hearings.length > 0) {
          this.liveHearings.set(res.hearings);
          if (!this.selectedHearingId()) {
            this.selectedHearingId.set(res.hearings[0].id);
          }
        }
      },
      error: (err) => console.error('Failed to load hearings:', err)
    });

    // 5. Fetch Tasks list
    this.apiService.getTasks().subscribe({
      next: (res) => {
        if (res.success && res.tasks && res.tasks.length > 0) {
          this.liveTasks.set(res.tasks);
          if (!this.selectedTaskId()) {
            this.selectedTaskId.set(res.tasks[0].id);
          }
        }
      },
      error: (err) => console.error('Failed to load tasks:', err)
    });
  }

  // Filtered Hearings
  filteredHearings = computed(() => {
    const list = this.liveHearings();
    const q = this.searchQuery().toLowerCase().trim();
    const client = this.selectedClientFilter();
    const status = this.selectedStatusFilter();

    return list.filter(h => {
      const clientName = h.courtCase?.matter?.client?.name || h.clientName || '';
      const caseNum = h.courtCase?.officialCaseNumber || h.caseNumber || '';
      const matterTitle = h.courtCase?.matter?.title || h.matterTitle || '';
      const purpose = h.purpose || '';

      if (client !== 'All' && !clientName.toLowerCase().includes(client.toLowerCase())) return false;
      if (status !== 'All' && purpose.toLowerCase() !== status.toLowerCase() && h.status?.toLowerCase() !== status.toLowerCase()) return false;
      if (q) {
        const match = clientName.toLowerCase().includes(q) ||
          caseNum.toLowerCase().includes(q) ||
          matterTitle.toLowerCase().includes(q) ||
          purpose.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  // Selected Hearing
  selectedHearing = computed(() => {
    const list = this.filteredHearings();
    if (list.length === 0) return this.liveHearings()[0] || null;
    const found = list.find(h => h.id === this.selectedHearingId());
    return found || list[0];
  });

  // Filtered Tasks
  filteredTasks = computed(() => {
    const list = this.liveTasks();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();

    return list.filter(t => {
      const title = t.title || '';
      const matterTitle = t.matter?.title || '';
      const matterNum = t.matter?.matterNumber || '';
      const assignee = t.assignedTo?.fullName || '';

      if (status !== 'All' && t.priority?.toLowerCase() !== status.toLowerCase() && t.status?.toLowerCase() !== status.toLowerCase()) return false;
      if (q) {
        const match = title.toLowerCase().includes(q) ||
          matterTitle.toLowerCase().includes(q) ||
          matterNum.toLowerCase().includes(q) ||
          assignee.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  // Selected Task
  selectedTask = computed(() => {
    const list = this.filteredTasks();
    if (list.length === 0) return this.liveTasks()[0] || null;
    const found = list.find(t => t.id === this.selectedTaskId());
    return found || list[0];
  });

  // Filtered Matters
  filteredMatters = computed(() => {
    const list = this.liveMatters();
    const q = this.searchQuery().toLowerCase().trim();
    const client = this.selectedClientFilter();
    const status = this.selectedStatusFilter();

    return list.filter(m => {
      const clientName = m.client?.name || '';
      const matterNum = m.matterNumber || '';
      const title = m.title || '';
      const stage = m.stage || '';

      if (client !== 'All' && !clientName.toLowerCase().includes(client.toLowerCase())) return false;
      if (status !== 'All' && stage.toLowerCase() !== status.toLowerCase() && m.status?.toLowerCase() !== status.toLowerCase()) return false;
      if (q) {
        const match = clientName.toLowerCase().includes(q) ||
          matterNum.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q) ||
          stage.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  // Selected Matter
  selectedMatter = computed(() => {
    const list = this.filteredMatters();
    if (list.length === 0) return this.liveMatters()[0] || null;
    const found = list.find(m => m.id === this.selectedMatterId());
    return found || list[0];
  });

  // Filtered Invoices
  filteredInvoices = computed(() => {
    const list = this.liveInvoices();
    const q = this.searchQuery().toLowerCase().trim();
    const client = this.selectedClientFilter();
    const status = this.selectedStatusFilter();

    return list.filter(inv => {
      const clientName = inv.client?.name || '';
      const invNum = inv.invoiceNumber || '';
      const matterTitle = inv.matter?.title || '';
      const invStatus = inv.status || '';

      if (client !== 'All' && !clientName.toLowerCase().includes(client.toLowerCase())) return false;
      if (status !== 'All' && invStatus.toLowerCase() !== status.toLowerCase()) return false;
      if (q) {
        const match = clientName.toLowerCase().includes(q) ||
          invNum.toLowerCase().includes(q) ||
          matterTitle.toLowerCase().includes(q) ||
          invStatus.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  // Selected Invoice
  selectedInvoice = computed(() => {
    const list = this.filteredInvoices();
    if (list.length === 0) return this.liveInvoices()[0] || null;
    const found = list.find(inv => inv.id === this.selectedInvoiceId());
    return found || list[0];
  });

  selectTab(tab: 'hearings' | 'tasks' | 'matters' | 'invoices') {
    this.activeTab.set(tab);
  }

  toggleTaskStatus(task: any) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    this.apiService.updateTaskStatus(task.id, { status: nextStatus }).subscribe({
      next: () => {
        this.loadDashboardData();
      }
    });
  }
}
