import { ShopCategory } from './session.models';

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: 1,
    slug: 'spozywcze',
    name: 'Spozywcze',
    products: [
      'Chleb wiejski',
      'Mleko 2%',
      'Jajka 10 szt.',
      'Maslo ekstra',
      'Jogurt naturalny',
      'Makaron penne',
      'Ryż bialy',
      'Kawa mielona',
      'Pomidory',
      'Banany'
    ]
  },
  {
    id: 2,
    slug: 'prasa',
    name: 'Prasa',
    products: [
      'Gazeta codzienna',
      'Magazyn sportowy',
      'Magazyn biznesowy',
      'Tygodnik opinii',
      'Krzyzowki XXL',
      'Magazyn motoryzacyjny',
      'Magazyn podrozniczy',
      'Magazyn kulinarny',
      'Magazyn technologiczny',
      'Komiks miesieczny'
    ]
  },
  {
    id: 3,
    slug: 'chemia',
    name: 'Chemia',
    products: [
      'Plyn do naczyn',
      'Proszek do prania',
      'Plyn do plukania',
      'Mydlo w plynie',
      'Papier toaletowy',
      'Reczniki papierowe',
      'Plyn do szyb',
      'Srodek do lazienki',
      'Worki na smieci',
      'Tabletki do zmywarki'
    ]
  },
  {
    id: 4,
    slug: 'sport',
    name: 'Sport',
    products: [
      'Pilka nozna',
      'Skakanka',
      'Mata do cwiczen',
      'Bidon sportowy',
      'Hantle 2 kg',
      'Gumy treningowe',
      'Rekawiczki fitness',
      'Opaska na glowe',
      'Rolka do masazu',
      'Pompka rowerowa'
    ]
  },
  {
    id: 5,
    slug: 'zwierzeta',
    name: 'Zwierzeta',
    products: [
      'Karma dla psa',
      'Karma dla kota',
      'Przysmaki treningowe',
      'Zwirek bentonitowy',
      'Miska stalowa',
      'Smycz regulowana',
      'Obroza nylonowa',
      'Zabawka gryzak',
      'Szczotka do siersci',
      'Podklady higieniczne'
    ]
  }
];

export function getCategoryById(categoryId: number): ShopCategory | null {
  return SHOP_CATEGORIES.find((category) => category.id === categoryId) ?? null;
}

export function getCategoryBySlug(slug: string): ShopCategory | null {
  return SHOP_CATEGORIES.find((category) => category.slug === slug) ?? null;
}
