import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-matter-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './matter-list.component.html',
  styleUrl: './matter-list.component.scss'
})
export class MatterListComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  matters = signal<any[]>([]);
  clients = signal<any[]>([]);
  attorneys = signal<any[]>([]);

  searchQuery = '';
  stageFilter = '';
  priorityFilter = '';
  categoryFilter = '';

  showIntakeModal = signal(false);

  // Computed KPI metrics
  totalMattersCount = computed(() => this.matters().length);
  urgentMattersCount = computed(() => 
    this.matters().filter(m => m.priority === 'HIGH' || m.priority === 'URGENT').length
  );
  trialStageCount = computed(() => 
    this.matters().filter(m => m.stage === 'TRIAL' || m.stage === 'PLEADINGS' || m.stage === 'DISCOVERY').length
  );
  landAndCommercialCount = computed(() => 
    this.matters().filter(m => m.category === 'LAND_DISPUTE' || m.category === 'COMMERCIAL').length
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.stageFilter) count++;
    if (this.priorityFilter) count++;
    if (this.categoryFilter) count++;
    if (this.searchQuery.trim()) count++;
    return count;
  });

  newMatter: any = {
    title: '',
    category: 'LAND_DISPUTE',
    description: '',
    clientId: '',
    leadAttorneyId: '',
    priority: 'MEDIUM',
    clientRole: 'PLAINTIFF',
    opposingParty: '',
    opposingCounsel: '',
    courtJurisdiction: '',
    feeArrangement: 'FIXED',
    agreedFee: null
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      this.loadMatters();
    });
    this.loadClients();
    this.loadAttorneys();
  }

  resetFilters() {
    this.searchQuery = '';
    this.stageFilter = '';
    this.priorityFilter = '';
    this.categoryFilter = '';
    this.loadMatters();
  }

  loadMatters() {
    this.apiService.getMatters({
      search: this.searchQuery,
      stage: this.stageFilter,
      priority: this.priorityFilter,
      category: this.categoryFilter
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.matters.set(res.matters || []);
        }
      }
    });
  }

  loadClients() {
    this.apiService.getClients().subscribe({
      next: (res) => {
        if (res.success) {
          this.clients.set(res.clients || []);
        }
      }
    });
  }

  loadAttorneys() {
    this.apiService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.attorneys.set(res.users || []);
          if (res.users?.length > 0 && !this.newMatter.leadAttorneyId) {
            this.newMatter.leadAttorneyId = res.users[0].id;
          }
        }
      }
    });
  }

  openIntakeModal() {
    this.showIntakeModal.set(true);
  }

  saveMatter() {
    if (!this.newMatter.title || !this.newMatter.clientId || !this.newMatter.leadAttorneyId) {
      alert('Please fill all required fields: Title, Client and Lead Counsel.');
      return;
    }

    this.apiService.createMatter(this.newMatter).subscribe({
      next: (res) => {
        if (res.success) {
          this.showIntakeModal.set(false);
          this.loadMatters();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to create matter.');
      }
    });
  }
}
