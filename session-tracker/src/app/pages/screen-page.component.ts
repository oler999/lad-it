import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { getCategoryById, SHOP_CATEGORIES } from '../models/shop-catalog';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-screen-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="app-shell">
      <section class="panel screen-layout">
        <article class="screen-card">
          <div class="topbar">
            <div>
              <span class="eyebrow">Kategoria produktow</span>
              <h1>{{ currentCategory().name }}</h1>
              <p class="muted">
                Wejscie do tej strony jest zapisywane w JSON, a kazde klikniecie produktu dopisywane do wizyty.
              </p>
            </div>

            <div class="action-row">
              <a class="button button-secondary" routerLink="/home">Wstecz</a>
              <button class="button button-ghost" type="button" (click)="logout()">Wyloguj</button>
            </div>
          </div>

          <span class="screen-badge">Aktywna kategoria: {{ currentCategory().name }}</span>

          <p class="lead">
            Klikaj produkty ponizej. Kazde klikniecie dopisuje nazwe produktu do aktywnej wizyty tej kategorii.
          </p>

          <div class="menu-grid">
            @for (product of currentCategory().products; track product) {
              <button class="link-card product-button" type="button" (click)="selectProduct(product)">
                <strong>{{ product }}</strong>
                <span>{{ isSelected(product) ? 'Kliknieto i zapisano do logu.' : 'Kliknij, aby zapisac wybor.' }}</span>
              </button>
            }
          </div>

          @if (selectedProducts().length) {
            <p class="muted selected-products">
              Wybrane produkty: {{ selectedProducts().join(', ') }}
            </p>
          }
        </article>

        <aside class="screen-visual">
          <div>
            <div class="screen-visual-number">{{ currentCategory().id }}</div>
            <p>Kategoria {{ currentCategory().name }} ma {{ currentCategory().products.length }} produktow.</p>
            <div class="category-switcher">
              @for (category of categories; track category.id) {
                <a class="button button-ghost" [routerLink]="['/category', category.id]">{{ category.name }}</a>
              }
            </div>
          </div>
        </aside>
      </section>
    </main>
  `
})
export class ScreenPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryIdSignal = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id') ?? 1))),
    { initialValue: 1 }
  );

  protected readonly sessionService = inject(SessionService);
  protected readonly categories = SHOP_CATEGORIES;
  protected readonly selectedProducts = signal<string[]>([]);
  protected readonly currentCategory = computed(() => {
    const currentCategoryId = this.categoryIdSignal();
    const category = getCategoryById(currentCategoryId);

    if (!category) {
      void this.router.navigate(['/home']);
      return SHOP_CATEGORIES[0];
    }

    return category;
  });

  constructor() {
    effect(() => {
      this.currentCategory().id;
      this.selectedProducts.set([]);
    });
  }

  protected async selectProduct(productName: string): Promise<void> {
    if (this.isSelected(productName)) {
      return;
    }

    const updatedProducts = [...this.selectedProducts(), productName];
    this.selectedProducts.set(updatedProducts);
    await this.sessionService.registerProductClick(productName);
  }

  protected isSelected(productName: string): boolean {
    return this.selectedProducts().includes(productName);
  }

  protected logout(): void {
    void this.sessionService.logout();
  }
}