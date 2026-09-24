import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  apiService = inject(ApiService);
  events = signal<any[]>([]);
  users = signal<any[]>([]);

  activeTab = signal<'all' | 'hearings' | 'consultations' | 'deadlines'>('all');
  searchQuery = signal('');
  eventTypeFilter = signal('');
  assignedUserFilter = signal('');

  selectedAttorneyId = '';
  checkDate = new Date().toISOString().split('T')[0];
  clashResult = signal<any>(null);
  isCheckingClashes = signal(false);

  // Computed KPI Metrics
  courtHearingsCount = computed(() =>
    this.events().filter(e => e.eventType === 'COURT_HEARING').length
  );

  consultationsCount = computed(() =>
    this.events().filter(e => e.eventType === 'APPOINTMENT' || e.eventType === 'CONSULTATION').length
  );

  deadlinesCount = computed(() =>
    this.events().filter(e => e.eventType === 'FILING_DEADLINE' || e.eventType === 'STATUTORY_DEADLINE').length
  );

  todayEventsCount = computed(() =>
    this.events().filter(e => this.isToday(e.startDate)).length
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.eventTypeFilter()) count++;
    if (this.assignedUserFilter()) count++;
    if (this.searchQuery().trim()) count++;
    return count;
  });

  filteredEvents = computed(() => {
    let list = this.events();
    const tab = this.activeTab();
    const type = this.eventTypeFilter();
    const user = this.assignedUserFilter();
    const q = this.searchQuery().trim().toLowerCase();

    // Tab Filter
    if (tab === 'hearings') {
      list = list.filter(e => e.eventType === 'COURT_HEARING');
    } else if (tab === 'consultations') {
      list = list.filter(e => e.eventType === 'APPOINTMENT' || e.eventType === 'CONSULTATION');
    } else if (tab === 'deadlines') {
      list = list.filter(e => e.eventType === 'FILING_DEADLINE' || e.eventType === 'STATUTORY_DEADLINE');
    }

    // Dropdown Filters
    if (type) {
      list = list.filter(e => e.eventType === type);
    }
    if (user) {
      list = list.filter(e => e.userId === user || e.user?.id === user);
    }

    // Search Query
    if (q) {
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.location || '').toLowerCase().includes(q) ||
        (e.eventType || '').toLowerCase().includes(q) ||
        (e.matter?.matterNumber || '').toLowerCase().includes(q) ||
        (e.matter?.title || '').toLowerCase().includes(q) ||
        (e.user?.fullName || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit() {
    this.apiService.getCalendarEvents().subscribe(res => {
      if (res.success) this.events.set(res.events || []);
    });
    this.apiService.getUsers().subscribe(res => {
      if (res.success) {
        this.users.set(res.users || []);
        if (res.users?.length > 0) this.selectedAttorneyId = res.users[0].id;
      }
    });
  }

  isToday(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.eventTypeFilter.set('');
    this.assignedUserFilter.set('');
  }

  checkClashes() {
    if (!this.selectedAttorneyId || !this.checkDate) return;
    this.isCheckingClashes.set(true);
    this.apiService.checkCalendarClashes(this.selectedAttorneyId, this.checkDate).subscribe({
      next: (res) => {
        this.isCheckingClashes.set(false);
        if (res.success) {
          this.clashResult.set(res);
        }
      },
      error: () => {
        this.isCheckingClashes.set(false);
      }
    });
  }

  getSelectedAttorneyName(): string {
    const u = this.users().find(user => user.id === this.selectedAttorneyId);
    return u ? u.fullName : 'Selected Counsel';
  }
}
