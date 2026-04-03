import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogStore } from '../models/session.models';
import { SHOP_CATEGORIES } from '../models/shop-catalog';
import { LogApiService } from '../services/log-api.service';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, JsonPipe],
  template: `
    <main class="app-shell">
      <section class="panel dashboard-layout">
        <section class="content-card">
          <header class="topbar">
            <div>
              <span class="eyebrow">Menu aplikacji</span>
              <h1 class="page-title">Maly sklep: wybierz kategorie</h1>
              <p class="muted">
                Kazda kategoria otwiera osobna strone z 10 produktami. Klikniecia produktow sa logowane.
              </p>
            </div>

            <div class="action-row">
              <button class="button button-ghost" type="button" (click)="logout()">
                Wyloguj
              </button>
            </div>
          </header>

          <div class="menu-grid">
            @for (category of categories; track category.id) {
              <a class="link-card" [routerLink]="['/category', category.id]">
                <strong>{{ category.name }}</strong>
                <span>Przejdz do kategorii i wybierz produkty do koszyka testowego.</span>
              </a>
            }
          </div>

          <section class="log-preview-card">
            <div class="topbar compact-topbar">
              <div>
                <span class="eyebrow">Podgląd pliku</span>
                <h2>Wspólny plik JSON dla wszystkich użytkowników</h2>
                <p class="muted">
                  Poniżej widzisz zawartość pliku z logami wszystkich sesji i odwiedzin ekranów.
                </p>
              </div>

              <div class="action-row">
                <a class="button button-ghost" [href]="downloadUrl" [attr.download]="downloadFileName">
                  Pobierz JSON
                </a>
                <button class="button button-secondary" type="button" (click)="refreshLogs()" [disabled]="logsLoading()">
                  {{ logsLoading() ? 'Odświeżanie...' : 'Odśwież podgląd' }}
                </button>
              </div>
            </div>

            @if (logsError()) {
              <div class="error-box">{{ logsError() }}</div>
            }

            @if (logStore(); as logs) {
              <div class="log-summary-grid">
                <div class="session-item">
                  <span>Plik</span>
                  <strong>activity-log.json</strong>
                </div>
                <div class="session-item">
                  <span>Sesje</span>
                  <strong>{{ logs.sessions.length }}</strong>
                </div>
                <div class="session-item">
                  <span>Odwiedziny kategorii</span>
                  <strong>{{ countScreenVisits(logs) }}</strong>
                </div>
                <div class="session-item">
                  <span>Klikniecia produktow</span>
                  <strong>{{ countProductClicks(logs) }}</strong>
                </div>
                <div class="session-item">
                  <span>Ostatnia aktualizacja</span>
                  <strong>
                    {{ logs.meta.updatedAt ? (logs.meta.updatedAt | date: 'yyyy-MM-dd HH:mm:ss') : 'brak' }}
                  </strong>
                </div>
              </div>

              <pre class="json-preview">{{ logs | json }}</pre>
            }
          </section>
        </section>

        <aside class="status-stack">
          <section class="status-card">
            <span class="eyebrow">Sesja</span>
            @if (sessionService.currentSession(); as session) {
              <div class="session-grid">
                <div class="session-item">
                  <span>Numer sesji</span>
                  <strong>#{{ session.sessionId }}</strong>
                </div>
                <div class="session-item">
                  <span>Użytkownik</span>
                  <strong>{{ session.identifier }}</strong>
                </div>
                <div class="session-item">
                  <span>Logowanie</span>
                  <strong>{{ session.loginAt | date: 'yyyy-MM-dd HH:mm:ss' }}</strong>
                </div>
                <div class="session-item">
                  <span>Aktywna kategoria</span>
                  <strong>{{ sessionService.activeScreen()?.screenName ?? 'brak' }}</strong>
                </div>
              </div>
            }
          </section>

          <section class="menu-card">
            <span class="eyebrow">Zakres testu</span>
            <p class="muted">
              Aplikacja zapisuje do pliku JSON numer sesji, dane logowania, historie odwiedzonych kategorii,
              czasy wejscia/wyjscia oraz liste kliknietych produktow dla kazdej wizyty.
            </p>
          </section>
        </aside>
      </section>
    </main>
  `
})
export class HomePageComponent {
  private readonly logApiService = inject(LogApiService);
  protected readonly sessionService = inject(SessionService);
  protected readonly categories = SHOP_CATEGORIES;
  protected readonly downloadUrl = this.logApiService.getLogsDownloadUrl();
  protected readonly downloadFileName = this.logApiService.getLogsDownloadFileName();
  protected readonly logStore = signal<LogStore | null>(null);
  protected readonly logsLoading = signal(false);
  protected readonly logsError = signal('');

  constructor() {
    void this.refreshLogs();
  }

  protected countScreenVisits(logs: LogStore): number {
    return logs.sessions.reduce((total, session) => total + session.screenVisits.length, 0);
  }

  protected countProductClicks(logs: LogStore): number {
    return logs.sessions.reduce(
      (total, session) =>
        total + session.screenVisits.reduce((visitTotal, visit) => visitTotal + visit.clickedProducts.length, 0),
      0
    );
  }

  protected async refreshLogs(): Promise<void> {
    this.logsLoading.set(true);
    this.logsError.set('');

    try {
      const logs = await this.logApiService.getLogs();
      this.logStore.set(logs);
    } catch {
      this.logsError.set('Nie udało się pobrać podglądu pliku JSON.');
    } finally {
      this.logsLoading.set(false);
    }
  }

  protected logout(): void {
    void this.sessionService.logout();
  }
}