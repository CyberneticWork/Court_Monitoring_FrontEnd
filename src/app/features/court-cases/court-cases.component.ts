import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-court-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './court-cases.component.html',
  styleUrl: './court-cases.component.scss'
})
export class CourtCasesComponent implements OnInit {
  apiService = inject(ApiService);
  activeTab = signal<'hearings' | 'cases' | 'courts'>('hearings');

  hearings = signal<any[]>([]);
  courtCases = signal<any[]>([]);
  courts = signal<any[]>([]);
  selectedHearing = signal<any>(null);

  searchQuery = signal('');
  purposeFilter = signal('');
  statusFilter = signal('');
  courtFilter = signal('');

  // Computed KPI Metrics
  todayHearingsCount = computed(() => 
    this.hearings().filter(h => this.isToday(h.hearingDate)).length
  );

  trialHearingsCount = computed(() => 
    this.hearings().filter(h => h.purpose === 'TRIAL' || h.purpose === 'ARGUMENT' || h.purpose === 'FURTHER_TRIAL').length
  );

  completedHearingsCount = computed(() => 
    this.hearings().filter(h => h.status === 'COMPLETED').length
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.purposeFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.courtFilter()) count++;
    if (this.searchQuery().trim()) count++;
    return count;
  });

  filteredHearings = computed(() => {
    let list = this.hearings();
    const p = this.purposeFilter();
    const s = this.statusFilter();
    const c = this.courtFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (p) {
      list = list.filter(h => h.purpose === p);
    }
    if (s) {
      list = list.filter(h => h.status === s);
    }
    if (c) {
      list = list.filter(h => (h.courtCase?.court?.id === c || h.courtCase?.courtId === c || h.courtCase?.court?.name === c));
    }
    if (q) {
      list = list.filter(h => 
        (h.courtCase?.officialCaseNumber || '').toLowerCase().includes(q) ||
        (h.courtCase?.matter?.title || '').toLowerCase().includes(q) ||
        (h.courtCase?.matter?.matterNumber || '').toLowerCase().includes(q) ||
        (h.courtCase?.court?.name || '').toLowerCase().includes(q) ||
        (h.courtroom || '').toLowerCase().includes(q) ||
        (h.judgeName || '').toLowerCase().includes(q) ||
        (h.purpose || '').toLowerCase().includes(q) ||
        (h.outcomeSummary || '').toLowerCase().includes(q) ||
        (h.courtDirections || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  filteredCourtCases = computed(() => {
    let list = this.courtCases();
    const q = this.searchQuery().trim().toLowerCase();
    const c = this.courtFilter();

    if (c) {
      list = list.filter(cs => cs.court?.id === c || cs.courtId === c || cs.court?.name === c);
    }
    if (q) {
      list = list.filter(cs => 
        (cs.officialCaseNumber || '').toLowerCase().includes(q) ||
        (cs.matter?.title || '').toLowerCase().includes(q) ||
        (cs.matter?.matterNumber || '').toLowerCase().includes(q) ||
        (cs.court?.name || '').toLowerCase().includes(q) ||
        (cs.currentStage || '').toLowerCase().includes(q) ||
        (cs.clientRole || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  filteredCourts = computed(() => {
    let list = this.courts();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(ct => 
        (ct.name || '').toLowerCase().includes(q) ||
        (ct.jurisdiction || '').toLowerCase().includes(q) ||
        (ct.location || '').toLowerCase().includes(q) ||
        (ct.judgeName || '').toLowerCase().includes(q) ||
        (ct.courtroomNo || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.apiService.getHearings().subscribe(res => {
      if (res.success) {
        const sorted = (res.hearings || []).sort((a: any, b: any) => {
          const dateDiff = new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (a.hearingTime || '').localeCompare(b.hearingTime || '');
        });
        this.hearings.set(sorted);
      }
    });
    this.apiService.getCourtCases().subscribe(res => {
      if (res.success) this.courtCases.set(res.courtCases || []);
    });
    this.apiService.getCourts().subscribe(res => {
      if (res.success) this.courts.set(res.courts || []);
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
    this.purposeFilter.set('');
    this.statusFilter.set('');
    this.courtFilter.set('');
  }

  openHearingModal(hearing: any) {
    this.selectedHearing.set(hearing);
  }

  closeHearingModal() {
    this.selectedHearing.set(null);
  }
}
