import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionService } from './services/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly sessionService = inject(SessionService);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.onPageUnload());
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', () => this.onPageUnload());
    }
  }

  private onPageUnload(): void {
    this.sessionService.closeSessionOnPageUnload();
  }
}
