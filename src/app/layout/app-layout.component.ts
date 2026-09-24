import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { IconComponent } from '../shared/components/icon.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FormsModule, IconComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})
export class AppLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  searchQuery = '';
  mobileMenuOpen = signal(false);
  activeFlyout = signal<string | null>(null);
  currentUrl = signal<string>(this.router.url);

  private flyoutCloseTimer: any = null;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
      this.activeFlyout.set(null);
      this.mobileMenuOpen.set(false);
    });
  }

  // Determine active pillar tab
  activePillar = computed<'operations' | 'diary' | 'finance'>(() => {
    const url = this.currentUrl();
    if (url.includes('/calendar') || url.includes('/tasks')) {
      return 'diary';
    }
    if (url.includes('/billing') || url.includes('/vault') || url.includes('/reports') || url.includes('/settings')) {
      return 'finance';
    }
    return 'operations';
  });

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  onMouseEnterPillar(name: string) {
    if (this.flyoutCloseTimer) {
      clearTimeout(this.flyoutCloseTimer);
      this.flyoutCloseTimer = null;
    }
    this.activeFlyout.set(name);
  }

  onMouseLeavePillar() {
    this.flyoutCloseTimer = setTimeout(() => {
      this.activeFlyout.set(null);
    }, 250); // 250ms buffer prevents abrupt disappearance when cursor moves across gap
  }

  toggleFlyout(name: string, event: Event) {
    event.stopPropagation();
    if (this.flyoutCloseTimer) {
      clearTimeout(this.flyoutCloseTimer);
      this.flyoutCloseTimer = null;
    }
    if (this.activeFlyout() === name) {
      this.activeFlyout.set(null);
    } else {
      this.activeFlyout.set(name);
    }
  }

  navigateTo(path: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.router.navigateByUrl(path).then(() => {
      this.activeFlyout.set(null);
      this.mobileMenuOpen.set(false);
    });
  }

  closeFlyout() {
    if (this.flyoutCloseTimer) {
      clearTimeout(this.flyoutCloseTimer);
      this.flyoutCloseTimer = null;
    }
    this.activeFlyout.set(null);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeFlyout.set(null);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/matters'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
