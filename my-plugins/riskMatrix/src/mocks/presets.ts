/**
 * Синтетические данные — 400 магазинов с реалистичными распределениями.
 * Используются, когда mock_mode_enabled=true ИЛИ когда запрос не возвращает
 * данных (fallback для Storybook).
 */

import { StorePoint } from '../types';
import { seededRandom, randNormal } from '../utils/scales';

interface FormatMock {
  id: string;
  name: string;
  planX: number;
  planY: number;
  count: number;
  revMin: number;
  revMax: number;
}

const FORMATS: FormatMock[] = [
  { id: 'express', name: 'Экспресс', planX: 2.09, planY: 0.55, count: 16, revMin: 8, revMax: 23 },
  { id: 'minimarket', name: 'Минимаркет', planX: 2.25, planY: 0.6, count: 101, revMin: 18, revMax: 43 },
  { id: 'super', name: 'Супермаркет', planX: 1.95, planY: 0.5, count: 29, revMin: 50, revMax: 110 },
  { id: 'home', name: 'Магазин у дома', planX: 1.15, planY: 0.45, count: 220, revMin: 4, revMax: 16 },
  { id: 'superstore', name: 'Суперстор', planX: 0.92, planY: 0.38, count: 34, revMin: 120, revMax: 300 },
];

const CITIES = [
  'Хабаровск',
  'Владивосток',
  'Уссурийск',
  'Артём',
  'Находка',
  'Биробиджан',
  'Спасск',
  'Комсомольск',
  'Амурск',
  'Большой Камень',
];

const SUBNAMES: Record<string, string[]> = {
  express: ['Центральный', 'Северный', 'Привокзальный', 'Чуркин', 'Эгершельд', 'Луговая', 'Морской'],
  minimarket: ['№1', '№2', '№3', '№4', '№5', '№6', '№7', '№8', '№9'],
  super: ['Восточный', 'Западный', 'Северный', 'Южный', 'Центральный', 'Морской'],
  home: ['Кировка', 'Заречье', 'Парковая', 'Лесная', 'Озёрная', 'Молодёжная', 'Школьная', 'Садовая', 'Полевая'],
  superstore: ['Молл', 'Гипер-1', 'Гипер-2', 'Восток', 'Запад', 'Центр'],
};

function generateStores(): StorePoint[] {
  const rng = seededRandom(20260415);
  const stores: StorePoint[] = [];
  let id = 0;

  FORMATS.forEach((fmt) => {
    for (let i = 0; i < fmt.count; i++) {
      // X: N(plan, plan*0.35) с heavy-tail outliers
      let x = randNormal(rng, fmt.planX, fmt.planX * 0.35);
      if (rng() < 0.07) x = fmt.planX * (1.5 + rng() * 1.5);
      if (rng() < 0.05) x = fmt.planX * (0.3 + rng() * 0.4);
      x = Math.max(0.05, x);

      // Y: коррелирована с X слабо
      let y = randNormal(rng, fmt.planY + (x - fmt.planX) * 0.15, fmt.planY * 0.4);
      if (rng() < 0.06) y = fmt.planY * (2 + rng() * 4);
      if (rng() < 0.04) y = fmt.planY * (0.2 + rng() * 0.4);
      y = Math.max(-0.5, y);

      const revenue = fmt.revMin + rng() * (fmt.revMax - fmt.revMin);
      const city = CITIES[Math.floor(rng() * CITIES.length)];
      const subNames = SUBNAMES[fmt.id];
      const sub = subNames[Math.floor(rng() * subNames.length)];
      const name = `Самбери ${fmt.name} «${sub}»`;

      stores.push({
        id: `s${id++}`,
        name,
        city,
        format: fmt.id,
        formatName: fmt.name,
        x: +x.toFixed(3),
        y: +y.toFixed(3),
        size: +revenue.toFixed(1),
        planX: fmt.planX,
        planY: fmt.planY,
        sumLoss: +(revenue * (x + Math.max(0, y)) / 100).toFixed(2),
      });
    }
  });

  return stores;
}

export interface MockPreset {
  stores: StorePoint[];
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
}

let cachedRetail: MockPreset | null = null;

export function getMockPreset(id: string): MockPreset {
  if (id === 'retail' || id === 'default') {
    if (!cachedRetail) {
      cachedRetail = {
        stores: generateStores(),
        xLabel: 'Уровень списаний',
        yLabel: 'Уровень недостач',
        xUnit: '%',
        yUnit: '%',
      };
    }
    return cachedRetail;
  }
  // Fallback — пустой
  return { stores: [], xLabel: 'X', yLabel: 'Y', xUnit: '', yUnit: '' };
}
