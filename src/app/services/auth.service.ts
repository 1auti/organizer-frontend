import { Injectable, inject } from '@angular/core';
import { environment } from '../environments/environments';
import { HttpClient } from '@angular/common/http';
import { ResponseLogin, ResponseRefresh } from '../interfaces/response.model';
import { User } from '../interfaces/user.model';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  apiUrl: string = environment.API_URL;

  constructor() {
    this.checkAuthStatus();
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private checkAuthStatus() {
    const isValid = this.tokenService.isValidToken();
    this.isAuthenticatedSubject.next(isValid);
  }

  login(username: string, password: string) {
    return this.http.post<ResponseLogin>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          this.tokenService.saveToken(response.token);
          this.tokenService.saveRefreshToken(response.refresh_token);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  register(username: string, email: string, password: string) {
    return this.http.post<User>(`${this.apiUrl}/api/users/register`, { username, email, password })
  }

  registerAndLogin(username: string, email: string, password: string) {
    return this.http.post<ResponseLogin>(`${this.apiUrl}/api/users/register`, { username, email, password })
    .pipe(switchMap(() => this.login(username, password)));
  }

  refreshToken(refreshToken: string) {
    const token = this.tokenService.getToken();
    return this.http.post<ResponseRefresh>(`${this.apiUrl}/api/users/refresh`, { refreshToken }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .pipe(tap(response =>{
      this.tokenService.saveToken(response.token)
      this.tokenService.saveRefreshToken(response.refresh_token)
    }))
  }

  create(username: string, email: string, password: string, admin: boolean) { // solo admin
    const token = this.tokenService.getToken();
    return this.http.post<ResponseLogin>(`${this.apiUrl}/api/users/create`, { username, email, password, admin }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
}
