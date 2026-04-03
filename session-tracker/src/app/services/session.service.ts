import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ActiveScreenVisit, SessionRecord } from '../models/session.models';
import { getCategoryById } from '../models/shop-catalog';
import { LogApiService } from './log-api.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(LogApiService);
  private readonly router = inject(Router);
  private readonly sessionState: WritableSignal<SessionRecord | null> = signal(null);
  private readonly activeScreenState: WritableSignal<ActiveScreenVisit | null> = signal(null);
  private readonly busyState = signal(false);
  private readonly sessionStorageKey = 'session-tracker.session';
  private readonly activeScreenStorageKey = 'session-tracker.active-screen';
  private navigationQueue: Promise<void> = Promise.resolve();

  readonly currentSession = this.sessionState.asReadonly();
  readonly activeScreen = this.activeScreenState.asReadonly();
  readonly isBusy = this.busyState.asReadonly();

  constructor() {
    this.restoreState();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navigationQueue = this.navigationQueue
          .then(() => this.syncActiveScreen())
          .catch((error: unknown) => {
            console.error('Screen tracking failed.', error);
          });
      });
  }

  hasActiveSession(): boolean {
    return this.currentSession() !== null;
  }

  async login(identifier: string): Promise<void> {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      throw new Error('Podaj imię lub adres e-mail.');
    }

    this.busyState.set(true);

    try {
      const session = await this.api.startSession(normalizedIdentifier);
      this.sessionState.set(session);
      this.persistSignal(this.sessionStorageKey, session);
      await this.router.navigate(['/home']);
    } finally {
      this.busyState.set(false);
    }
  }

  async logout(): Promise<void> {
    const session = this.currentSession();

    if (!session) {
      await this.router.navigate(['/login']);
      return;
    }

    this.busyState.set(true);
    const logoutAt = new Date().toISOString();

    try {
      await this.closeActiveScreen(logoutAt);
      await this.api.endSession(session.sessionId, logoutAt);
    } finally {
      this.sessionState.set(null);
      this.activeScreenState.set(null);
      this.clearPersistedState();
      this.busyState.set(false);
      await this.router.navigate(['/login']);
    }
  }

  private async syncActiveScreen(): Promise<void> {
    const session = this.currentSession();
    const nextScreenName = this.extractScreenName(this.router.routerState.snapshot.root);
    const activeScreen = this.activeScreen();

    if (!session) {
      if (activeScreen) {
        await this.closeActiveScreen();
      }

      return;
    }

    if (activeScreen?.screenName === nextScreenName) {
      return;
    }

    if (activeScreen) {
      await this.closeActiveScreen();
    }

    if (!nextScreenName) {
      return;
    }

    const enteredAt = new Date().toISOString();
    const category = nextScreenName.replace('Kategoria: ', '');
    const visit = await this.api.startScreenVisit(session.sessionId, nextScreenName, category, enteredAt);

    this.activeScreenState.set({
      visitId: visit.visitId,
      screenName: visit.screenName,
      category: visit.category,
      enteredAt: visit.enteredAt
    });
    this.persistSignal(this.activeScreenStorageKey, this.activeScreen());
  }

  async registerProductClick(productName: string): Promise<void> {
    const activeScreen = this.activeScreen();

    if (!activeScreen) {
      return;
    }

    const normalizedProductName = productName.trim();

    if (!normalizedProductName) {
      return;
    }

    await this.api.registerProductClick(activeScreen.visitId, normalizedProductName);
  }

  private async closeActiveScreen(leftAt = new Date().toISOString()): Promise<void> {
    const activeScreen = this.activeScreen();

    if (!activeScreen) {
      return;
    }

    await this.api.endScreenVisit(activeScreen.visitId, leftAt);
    this.activeScreenState.set(null);
    sessionStorage.removeItem(this.activeScreenStorageKey);
  }

  closeSessionOnPageUnload(): void {
    const session = this.currentSession();
    const activeScreen = this.activeScreen();
    const logoutAt = new Date().toISOString();

    if (activeScreen) {
      this.api.endScreenVisitWithBeacon(activeScreen.visitId, logoutAt);
    }

    if (session) {
      this.api.endSessionWithBeacon(session.sessionId, logoutAt);
      this.clearPersistedState();
    }
  }

  private extractScreenName(snapshot: ActivatedRouteSnapshot): string | null {
    let activeSnapshot: ActivatedRouteSnapshot | null = snapshot;

    while (activeSnapshot?.firstChild) {
      activeSnapshot = activeSnapshot.firstChild;
    }

    const routePath = activeSnapshot?.routeConfig?.path;
    const categoryId = Number(activeSnapshot?.paramMap.get('id'));

    if (routePath !== 'category/:id' || !Number.isInteger(categoryId)) {
      return null;
    }

    const category = getCategoryById(categoryId);

    if (!category) {
      return null;
    }

    return `Kategoria: ${category.name}`;
  }

  private restoreState(): void {
    const savedSession = this.readPersistedState<SessionRecord>(this.sessionStorageKey);
    const savedActiveScreen = this.readPersistedState<ActiveScreenVisit>(this.activeScreenStorageKey);

    if (savedSession) {
      this.sessionState.set(savedSession);
    }

    if (savedActiveScreen) {
      this.activeScreenState.set(savedActiveScreen);
    }
  }

  private readPersistedState<T>(storageKey: string): T | null {
    const rawValue = sessionStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }

  private persistSignal(storageKey: string, value: unknown): void {
    if (value === null) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(value));
  }

  private clearPersistedState(): void {
    sessionStorage.removeItem(this.sessionStorageKey);
    sessionStorage.removeItem(this.activeScreenStorageKey);
  }
}