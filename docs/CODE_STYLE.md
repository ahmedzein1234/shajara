# Code Style Guide

This document outlines the coding standards and conventions for the Shajara project.

## General Principles

1. **Readability over cleverness** - Code should be easy to understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Self-documenting** - Use clear names; add comments only when needed
4. **Minimal dependencies** - Prefer standard library when possible

## TypeScript

### Naming Conventions

```typescript
// Files: kebab-case
// person-form.tsx, use-voice-input.ts

// Components: PascalCase
function PersonForm() { ... }

// Functions/Variables: camelCase
const personData = fetchPerson();
function calculateAge() { ... }

// Constants: SCREAMING_SNAKE_CASE
const MAX_TREE_DEPTH = 10;
const API_ENDPOINTS = { ... };

// Types/Interfaces: PascalCase
interface PersonData { ... }
type RelationshipType = 'parent' | 'spouse' | 'sibling';

// Generics: Single uppercase letter or descriptive PascalCase
function transform<T>(value: T): T { ... }
function createStore<TState>(initial: TState) { ... }
```

### Type Annotations

```typescript
// Prefer inference when obvious
const name = 'Ahmed';  // Good
const name: string = 'Ahmed';  // Unnecessary

// Explicit types for function signatures
function greet(name: string): string {
  return `Hello, ${name}`;
}

// Use interfaces for objects
interface Person {
  id: string;
  name: string;
  birthDate?: Date;
}

// Use type for unions/primitives
type Gender = 'male' | 'female';
type ID = string | number;
```

### Imports

```typescript
// Order: React, external, internal, types
import React, { useState, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

import { Button } from '@/components/ui/button';
import { PersonForm } from '@/components/forms/person-form';

import type { Person } from '@/types';
```

## React

### Component Structure

```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Component

interface Props {
  person: Person;
  onSave: (person: Person) => void;
}

export function PersonCard({ person, onSave }: Props) {
  // Hooks first
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Derived state
  const displayName = person.fullNameAr || person.givenName;

  // Callbacks
  const handleSave = useCallback(() => {
    onSave(person);
    setIsEditing(false);
  }, [person, onSave]);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Early returns
  if (!person) return null;

  // Render
  return (
    <div className="card">
      <h2>{displayName}</h2>
      {isEditing && (
        <PersonForm person={person} onSave={handleSave} />
      )}
    </div>
  );
}
```

### Hooks

```typescript
// Custom hooks start with "use"
function usePersonData(personId: string) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerson(personId).then(setPerson).finally(() => setLoading(false));
  }, [personId]);

  return { person, loading };
}

// Return objects for multiple values
// Return tuples for simple state + setter patterns
```

## CSS / Tailwind

### Class Organization

```tsx
// Order: layout, sizing, spacing, typography, colors, effects, states
<div className={cn(
  // Layout
  'flex flex-col',
  // Sizing
  'w-full max-w-md',
  // Spacing
  'p-4 gap-2',
  // Typography
  'text-lg font-bold',
  // Colors
  'bg-white text-gray-900',
  // Effects
  'shadow-lg rounded-xl',
  // States
  'hover:bg-gray-50 focus:ring-2'
)}>
```

### RTL Support

```tsx
// Use logical properties
'ms-4'  // margin-inline-start (not ml-4)
'ps-4'  // padding-inline-start (not pl-4)
'start-0'  // inset-inline-start (not left-0)

// Use RTL-aware components
<div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

## API Routes

### Structure

```typescript
// app/api/persons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    const persons = await db.prepare('SELECT * FROM persons').all();

    return NextResponse.json({ data: persons.results });
  } catch (error) {
    console.error('Failed to fetch persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}
```

### Error Handling

```typescript
// Use specific error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Return appropriate HTTP status codes
// 200 - Success
// 201 - Created
// 400 - Bad Request (validation errors)
// 401 - Unauthorized
// 403 - Forbidden
// 404 - Not Found
// 500 - Internal Server Error
```

## Database

### Queries

```typescript
// Use parameterized queries ALWAYS
const person = await db
  .prepare('SELECT * FROM persons WHERE id = ?')
  .bind(personId)
  .first();

// Never interpolate user input
// BAD: `SELECT * FROM persons WHERE name = '${name}'`
```

### Migrations

```sql
-- migrations/0005_add_birth_place.sql

-- Add birth_place column to persons table
ALTER TABLE persons ADD COLUMN birth_place TEXT;

-- Create index for location-based queries
CREATE INDEX idx_persons_birth_place ON persons(birth_place);
```

## Testing

### Unit Tests

```typescript
// Component test
describe('PersonCard', () => {
  it('displays person name', () => {
    render(<PersonCard person={mockPerson} />);
    expect(screen.getByText(mockPerson.givenName)).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', async () => {
    const onSave = vi.fn();
    render(<PersonCard person={mockPerson} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(mockPerson);
  });
});
```

### E2E Tests

```typescript
// e2e/tree-creation.spec.ts
test('user can create a family tree', async ({ page }) => {
  await page.goto('/en/tree/new');
  await page.fill('[name="name"]', 'My Family');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/tree\/[a-z0-9-]+$/);
  await expect(page.getByText('My Family')).toBeVisible();
});
```

## Git

### Commit Messages

```
<type>: <subject>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat: add voice input for AI assistant

fix: correct RTL layout in person card

docs: update deployment runbook
```

### Branch Naming

```
feature/add-voice-input
fix/rtl-layout-person-card
chore/update-dependencies
```

## Accessibility

### ARIA Labels

```tsx
// All interactive elements need accessible names
<button aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}>
  <X />
</button>

// Use semantic HTML
<nav aria-label="Main navigation">
<main>
<article>
<aside>
```

### Keyboard Navigation

```tsx
// All interactive elements must be keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
>
```

## Internationalization

### Translation Keys

```json
// Use nested structure for organization
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "person": {
    "form": {
      "name": "Name",
      "birthDate": "Birth Date"
    }
  }
}
```

### Using Translations

```tsx
import { useTranslations } from 'next-intl';

function PersonForm() {
  const t = useTranslations('person.form');

  return (
    <label>{t('name')}</label>
  );
}
```
