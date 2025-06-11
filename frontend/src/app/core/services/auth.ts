import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signal for reactive UI
  public currentUser = signal<User | null>(null);

  constructor() {
    // Check if user is logged in from localStorage (only in browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        this.setCurrentUser(user);
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    // TODO: Implement real authentication with Firebase Auth
    // For now, return a mock user based on email
    const mockUser: User = {
      id: '1',
      email: email,
      role: email.includes('molino') ? 'admin_molino' : 'dueno_panaderia',
      createdAt: new Date()
    };

    this.setCurrentUser(mockUser);
    return new BehaviorSubject(mockUser).asObservable();
  }

  logout(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(role: User['role']): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }

  hasAnyRole(roles: User['role'][]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  private setCurrentUser(user: User): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
    this.currentUser.set(user);
  }
}
