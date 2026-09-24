import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './layout/app-layout.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ClientsComponent } from './features/clients/clients.component';
import { MatterListComponent } from './features/matters/matter-list.component';
import { MatterDetailComponent } from './features/matters/matter-detail.component';
import { CourtCasesComponent } from './features/court-cases/court-cases.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { VaultComponent } from './features/vault/vault.component';
import { BillingComponent } from './features/billing/billing.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/login', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'matters', component: MatterListComponent },
      { path: 'matters/:id', component: MatterDetailComponent },
      { path: 'court-cases', component: CourtCasesComponent },
      { path: 'courts', redirectTo: 'court-cases', pathMatch: 'full' },
      { path: 'calendar', component: CalendarComponent },
      { path: 'schedule', redirectTo: 'calendar', pathMatch: 'full' },
      { path: 'tasks', component: TasksComponent },
      { path: 'vault', component: VaultComponent },
      { path: 'safe-vault', redirectTo: 'vault', pathMatch: 'full' },
      { path: 'billing', component: BillingComponent },
      { path: 'finance', redirectTo: 'billing', pathMatch: 'full' },
      { path: 'invoices', redirectTo: 'billing', pathMatch: 'full' },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
