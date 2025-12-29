/**
 * Test Utilities
 * Custom render functions and helpers for testing React components
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock providers wrapper
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <div dir="ltr" lang="en">
      {children}
    </div>
  );
}

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export function createMockPerson(overrides = {}) {
  return {
    id: `person-${Math.random().toString(36).slice(2)}`,
    tree_id: 'tree-1',
    given_name: 'Ahmed',
    patronymic_chain: 'bin Mohammed',
    family_name: 'Al-Rashid',
    full_name_ar: 'أحمد بن محمد الراشد',
    full_name_en: 'Ahmed bin Mohammed Al-Rashid',
    gender: 'male' as const,
    birth_date: '1980-01-15',
    birth_place: 'Riyadh, Saudi Arabia',
    is_living: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTree(overrides = {}) {
  return {
    id: `tree-${Math.random().toString(36).slice(2)}`,
    name_ar: 'شجرة الاختبار',
    name_en: 'Test Tree',
    description_ar: 'وصف الشجرة',
    description_en: 'Tree description',
    user_id: 'user-1',
    is_public: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUser(overrides = {}) {
  return {
    id: `user-${Math.random().toString(36).slice(2)}`,
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockRelationship(overrides = {}) {
  return {
    id: `rel-${Math.random().toString(36).slice(2)}`,
    tree_id: 'tree-1',
    person1_id: 'person-1',
    person2_id: 'person-2',
    relationship_type: 'parent_child' as const,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Wait helpers
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Form helpers
export async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>
) {
  for (const [label, value] of Object.entries(fields)) {
    const input = document.querySelector(`[name="${label}"]`) as HTMLInputElement;
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
}
