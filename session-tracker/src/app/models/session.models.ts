export interface SessionRecord {
  sessionId: number;
  identifier: string;
  loginAt: string;
  logoutAt: string | null;
  screenVisits: ScreenVisitRecord[];
}

export interface ScreenVisitRecord {
  visitId: number;
  screenName: string;
  category: string;
  enteredAt: string;
  leftAt: string | null;
  clickedProducts: string[];
}

export interface ActiveScreenVisit {
  visitId: number;
  screenName: string;
  category: string;
  enteredAt: string;
}

export interface ShopCategory {
  id: number;
  slug: string;
  name: string;
  products: string[];
}

export interface LogStoreMeta {
  nextSessionId: number;
  nextVisitId: number;
  updatedAt: string | null;
}

export interface LogStore {
  meta: LogStoreMeta;
  sessions: SessionRecord[];
}