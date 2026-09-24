import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  permissions: string[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: UserProfile;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/api/auth';
  
  // State Signals
  currentUser = signal<UserProfile | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('lpms_token'));
  
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role || '');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          localStorage.setItem('lpms_token', res.token);
          localStorage.setItem('lpms_user', JSON.stringify(res.user));
          this.token.set(res.token);
          this.currentUser.set(res.user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('lpms_token');
    localStorage.removeItem('lpms_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(permissionCode) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  }

  private getStoredUser(): UserProfile | null {
    const userJson = localStorage.getItem('lpms_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
}
