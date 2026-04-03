import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { LogStore, ScreenVisitRecord, SessionRecord } from '../models/session.models';

@Injectable({ providedIn: 'root' })
export class LogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = this.resolveApiBase();

  getLogsDownloadUrl(): string {
    return `${this.apiBase}/logs/download`;
  }

  getLogsDownloadFileName(now = new Date()): string {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `activity-log-${year}-${month}-${day}.json`;
  }

  getLogs(): Promise<LogStore> {
    return firstValueFrom(this.http.get<LogStore>(`${this.apiBase}/logs`));
  }

  startSession(identifier: string): Promise<SessionRecord> {
    return firstValueFrom(this.http.post<SessionRecord>(`${this.apiBase}/sessions`, { identifier }));
  }

  endSession(sessionId: number, logoutAt: string): Promise<SessionRecord> {
    return firstValueFrom(
      this.http.patch<SessionRecord>(`${this.apiBase}/sessions/${sessionId}/logout`, { logoutAt })
    );
  }

  endSessionWithBeacon(sessionId: number, logoutAt: string): boolean {
    const url = `${this.apiBase}/sessions/${sessionId}/logout`;
    const params = new URLSearchParams();
    params.set('logoutAt', logoutAt);

    try {
      const sent = navigator.sendBeacon(url, params);
      if (!sent) {
        console.warn('Failed to send session logout beacon');
      }
      return sent;
    } catch (error) {
      console.error('Error sending session logout beacon:', error);
      return false;
    }
  }

  startScreenVisit(
    sessionId: number,
    screenName: string,
    category: string,
    enteredAt: string
  ): Promise<ScreenVisitRecord> {
    return firstValueFrom(
      this.http.post<ScreenVisitRecord>(`${this.apiBase}/screen-visits`, {
        sessionId,
        screenName,
        category,
        enteredAt
      })
    );
  }

  registerProductClick(visitId: number, productName: string): Promise<ScreenVisitRecord> {
    return firstValueFrom(
      this.http.patch<ScreenVisitRecord>(`${this.apiBase}/screen-visits/${visitId}/product-click`, {
        productName
      })
    );
  }

  endScreenVisit(visitId: number, leftAt: string): Promise<ScreenVisitRecord> {
    return firstValueFrom(
      this.http.patch<ScreenVisitRecord>(`${this.apiBase}/screen-visits/${visitId}/exit`, { leftAt })
    );
  }

  endScreenVisitWithBeacon(visitId: number, leftAt: string): boolean {
    const url = `${this.apiBase}/screen-visits/${visitId}/exit`;
    const params = new URLSearchParams();
    params.set('leftAt', leftAt);

    try {
      const sent = navigator.sendBeacon(url, params);
      if (!sent) {
        console.warn('Failed to send screen visit exit beacon');
      }
      return sent;
    } catch (error) {
      console.error('Error sending screen visit exit beacon:', error);
      return false;
    }
  }

  private resolveApiBase(): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return 'http://localhost:3000/api';
    }

    return '/api';
  }
}