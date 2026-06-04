import uuid from 'react-native-uuid';

import type { Account, Category } from '../api/types';
import { MONEY_SCHEMA_VERSION, type MoneyData } from './types';

function newId(): string {
  return uuid.v4() as string;
}

/** Starter categories mirror the backend's register seed
 * (mint-ai/src/features/category/starters.py) so that, if a user later signs in
 * and we import their server data, the names line up and de-dupe cleanly. */
const STARTER_EXPENSE = [
  '🍔 Food',
  '🎉 Social Life',
  '🐾 Pets',
  '🚗 Transport',
  '🎭 Culture',
  '🏠 Household',
  '👕 Apparel',
  '💄 Beauty',
  '🏥 Health',
  '📚 Education',
  '🎁 Gift',
  '📦 Other',
] as const;

const STARTER_INCOME = ['💰 Income', '🔄 Transfer', '💵 Cash'] as const;

function starterCategories(): Category[] {
  return [
    ...STARTER_EXPENSE.map((name) => ({ id: newId(), name, kind: 'expense' as const })),
    ...STARTER_INCOME.map((name) => ({ id: newId(), name, kind: 'income' as const })),
  ];
}

function starterAccount(): Account {
  return { id: newId(), name: 'Cash', type: 'cash', currency: 'IDR', institution: null };
}

/** Build the initial local Money state for a brand-new install. Runs with no
 * network, so a fresh guest immediately has an account + categories to use —
 * removing the old "must load reference data online once" requirement. */
export function defaultMoneyData(): MoneyData {
  return {
    accounts: [starterAccount()],
    categories: starterCategories(),
    transactions: [],
    schemaVersion: MONEY_SCHEMA_VERSION,
    seeded: true,
    imported: false,
  };
}
