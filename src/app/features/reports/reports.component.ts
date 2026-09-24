import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  apiService = inject(ApiService);
  activeTab = signal<'workload' | 'stages'>('workload');
  workload = signal<any[]>([]);
  matterStages = signal<any[]>([]);

  // Computed KPIs
  totalAttorneysCount = computed(() => this.workload().length);

  totalLeadMatters = computed(() =>
    this.workload().reduce((acc, w) => acc + (w._count?.leadMatters || 0), 0)
  );

  totalActiveTasks = computed(() =>
    this.workload().reduce((acc, w) => acc + (w._count?.assignedTasks || 0), 0)
  );

  totalMattersInPipeline = computed(() =>
    this.matterStages().reduce((acc, s) => acc + (s._count?.id || 0), 0)
  );

  ngOnInit() {
    this.apiService.getAttorneyWorkload().subscribe(res => {
      if (res.success) this.workload.set(res.workload || []);
    });
    this.apiService.getMattersReport().subscribe(res => {
      if (res.success) this.matterStages.set(res.byStage || []);
    });
  }

  getStagePercent(count: number): number {
    const total = this.totalMattersInPipeline();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }
}
