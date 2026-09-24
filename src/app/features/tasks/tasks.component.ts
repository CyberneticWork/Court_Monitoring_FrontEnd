import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);

  tasks = signal<any[]>([]);
  users = signal<any[]>([]);
  matters = signal<any[]>([]);

  activeTab = signal<'all' | 'due-today' | 'overdue' | 'my-tasks'>('all');
  todayCount = signal(0);
  overdueCount = signal(0);

  searchQuery = signal('');
  priorityFilter = signal('');
  statusFilter = signal('');
  assignedUserFilter = signal('');

  // Create Task Modal State
  showCreateModal = signal(false);
  isSubmitting = signal(false);
  newTask = {
    title: '',
    description: '',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    matterId: '',
    assignedToId: ''
  };

  // Computed KPI Metrics
  totalTasksCount = computed(() => this.tasks().length);

  highPriorityCount = computed(() =>
    this.tasks().filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length
  );

  completedCount = computed(() =>
    this.tasks().filter(t => t.status === 'COMPLETED').length
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.priorityFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.assignedUserFilter()) count++;
    if (this.searchQuery().trim()) count++;
    return count;
  });

  filteredTasks = computed(() => {
    let list = this.tasks();
    const p = this.priorityFilter();
    const s = this.statusFilter();
    const u = this.assignedUserFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (p) {
      list = list.filter(t => t.priority === p);
    }
    if (s) {
      list = list.filter(t => t.status === s);
    }
    if (u) {
      list = list.filter(t => t.assignedToId === u || t.assignedTo?.id === u);
    }
    if (q) {
      list = list.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.matter?.matterNumber || '').toLowerCase().includes(q) ||
        (t.matter?.title || '').toLowerCase().includes(q) ||
        (t.assignedTo?.fullName || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.loadTasks();
    this.loadCounts();
    this.apiService.getUsers().subscribe(res => {
      if (res.success) {
        this.users.set(res.users || []);
        if (res.users?.length > 0 && !this.newTask.assignedToId) {
          this.newTask.assignedToId = res.users[0].id;
        }
      }
    });
    this.apiService.getMatters().subscribe(res => {
      if (res.success) {
        this.matters.set(res.matters || []);
        if (res.matters?.length > 0 && !this.newTask.matterId) {
          this.newTask.matterId = res.matters[0].id;
        }
      }
    });
  }

  loadTasks() {
    const tab = this.activeTab();
    if (tab === 'due-today') {
      this.apiService.getDueTodayTasks().subscribe(res => {
        if (res.success) this.tasks.set(res.tasks || []);
      });
    } else if (tab === 'overdue') {
      this.apiService.getOverdueTasks().subscribe(res => {
        if (res.success) this.tasks.set(res.tasks || []);
      });
    } else if (tab === 'my-tasks') {
      this.apiService.getTasks({ myTasks: true }).subscribe(res => {
        if (res.success) this.tasks.set(res.tasks || []);
      });
    } else {
      this.apiService.getTasks().subscribe(res => {
        if (res.success) this.tasks.set(res.tasks || []);
      });
    }
  }

  loadCounts() {
    this.apiService.getDueTodayTasks().subscribe(res => {
      if (res.success) this.todayCount.set(res.tasks?.length || 0);
    });
    this.apiService.getOverdueTasks().subscribe(res => {
      if (res.success) this.overdueCount.set(res.tasks?.length || 0);
    });
  }

  setFilter(tab: 'all' | 'due-today' | 'overdue' | 'my-tasks') {
    this.activeTab.set(tab);
    this.loadTasks();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.priorityFilter.set('');
    this.statusFilter.set('');
    this.assignedUserFilter.set('');
  }

  toggleTask(task: any) {
    this.apiService.updateTaskStatus(task.id, { status: 'COMPLETED' }).subscribe(() => {
      this.loadTasks();
      this.loadCounts();
    });
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  createTask() {
    if (!this.newTask.title.trim()) return;
    this.isSubmitting.set(true);
    this.apiService.createTask(this.newTask).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.closeCreateModal();
          this.loadTasks();
          this.loadCounts();
          this.newTask.title = '';
          this.newTask.description = '';
        }
      },
      error: () => {
        this.isSubmitting.set(false);
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

  isOverdue(dateStr: string, status: string): boolean {
    if (!dateStr || status === 'COMPLETED') return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }
}
