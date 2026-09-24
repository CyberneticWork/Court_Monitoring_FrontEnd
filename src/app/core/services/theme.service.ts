import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>(this.getStoredTheme());

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem('lpms_theme', theme);
      if (theme === 'light') {
        document.body.classList.add('light-mode');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.body.classList.remove('light-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    });
  }

  toggleTheme() {
    this.currentTheme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
  }

  private getStoredTheme(): Theme {
    const saved = localStorage.getItem('lpms_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark'; // default to executive dark suite
  }
}
