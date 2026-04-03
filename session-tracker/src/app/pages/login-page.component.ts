import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LogApiService } from '../services/log-api.service';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="app-shell">
      <section class="login-panel panel">
        <section class="login-card">
          <p class="login-message">
            Ta aplikacja została stworzona w celach naukowych. Zalogowanie oznacza zgodę na zbieranie twoich danych w celach naukowych. Zamknij aplikację w przypadku gdy nie zgadzasz się na udostępnienie swoich danych.
          </p>

          <form class="form-stack" (ngSubmit)="submit()">
            <div>
              <label class="field-label" for="identifier">Imię lub e-mail</label>
              <input
                id="identifier"
                name="identifier"
                class="text-input"
                type="text"
                autocomplete="email"
                [(ngModel)]="identifier"
                placeholder="np. jan.kowalski@example.com"
              />
            </div>

            @if (errorMessage) {
              <div class="error-box">{{ errorMessage }}</div>
            }

            <div class="button-row">
              <button class="button button-primary" type="submit" [disabled]="sessionService.isBusy()">
                {{ sessionService.isBusy() ? 'Logowanie...' : 'Zaloguj' }}
              </button>
              <a class="button button-ghost" [href]="downloadUrl" [attr.download]="downloadFileName">
                Pobierz JSON
              </a>
            </div>
          </form>
        </section>
      </section>
    </main>
  `
})
export class LoginPageComponent {
  private readonly logApiService = inject(LogApiService);
  protected readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly downloadUrl = this.logApiService.getLogsDownloadUrl();
  protected readonly downloadFileName = this.logApiService.getLogsDownloadFileName();
  protected identifier = '';
  protected errorMessage = '';

  constructor() {
    if (this.sessionService.hasActiveSession()) {
      void this.router.navigate(['/home']);
    }
  }

  protected async submit(): Promise<void> {
    this.errorMessage = '';

    try {
      await this.sessionService.login(this.identifier);
    } catch (error: unknown) {
      this.errorMessage = error instanceof Error ? error.message : 'Nie udało się rozpocząć sesji.';
    }
  }
}