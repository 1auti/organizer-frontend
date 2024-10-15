import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  const addToken = (request: any) => {
    const token = tokenService.getToken();
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  }

  return next(addToken(req)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && tokenService.getRefreshToken()) {
        return authService.refreshToken(tokenService.getRefreshToken()!).pipe(
          switchMap(() => {
            return next(addToken(req));
          }),
          catchError((refreshError) => {
            tokenService.removeToken();
            tokenService.removeRefreshToken();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};