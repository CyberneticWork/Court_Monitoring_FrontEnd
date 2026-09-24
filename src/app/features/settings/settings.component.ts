import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);

  activeTab = signal<'users' | 'roles' | 'audit'>('users');

  users = signal<any[]>([]);
  roles = signal<any[]>([]);
  auditLogs = signal<any[]>([]);

  searchQuery = signal('');
  roleFilter = signal('');

  // Computed KPI Metrics
  totalUsersCount = computed(() => this.users().length);
  totalRolesCount = computed(() => this.roles().length);
  totalAuditLogsCount = computed(() => this.auditLogs().length);

  totalPermissionsCount = computed(() => {
    let count = 0;
    this.roles().forEach(r => {
      count += (r.permissions?.length || 0);
    });
    return count;
  });

  filteredUsers = computed(() => {
    let list = this.users();
    const r = this.roleFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (r) {
      list = list.filter(u => u.role === r);
    }
    if (q) {
      list = list.filter(u =>
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  filteredLogs = computed(() => {
    let list = this.auditLogs();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(log =>
        (log.action || '').toLowerCase().includes(q) ||
        (log.entityType || '').toLowerCase().includes(q) ||
        (log.user?.fullName || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.apiService.getUsers().subscribe(res => {
      if (res.success) this.users.set(res.users || []);
    });
    this.apiService.getRoles().subscribe(res => {
      if (res.success) this.roles.set(res.roles || []);
    });
    this.apiService.getAuditLogs().subscribe(res => {
      if (res.success) this.auditLogs.set(res.logs || []);
    });
  }
}
