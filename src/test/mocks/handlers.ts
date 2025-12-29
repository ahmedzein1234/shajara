/**
 * MSW Request Handlers
 * Mock API responses for testing
 */

import { http, HttpResponse } from 'msw';

// Mock data
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
};

export const mockTree = {
  id: 'tree-1',
  name_ar: 'شجرة الاختبار',
  name_en: 'Test Tree',
  description_ar: 'وصف الشجرة',
  description_en: 'Tree description',
  user_id: 'user-1',
  is_public: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockPerson = {
  id: 'person-1',
  tree_id: 'tree-1',
  given_name: 'Ahmed',
  patronymic_chain: 'bin Mohammed',
  family_name: 'Al-Rashid',
  full_name_ar: 'أحمد بن محمد الراشد',
  full_name_en: 'Ahmed bin Mohammed Al-Rashid',
  gender: 'male',
  birth_date: '1980-01-15',
  birth_place: 'Riyadh, Saudi Arabia',
  is_living: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockRelationship = {
  id: 'rel-1',
  tree_id: 'tree-1',
  person1_id: 'person-1',
  person2_id: 'person-2',
  relationship_type: 'parent_child',
  created_at: new Date().toISOString(),
};

// API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: mockUser,
        session: { token: 'mock-session-token' },
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      user: { ...mockUser, email: body.email, name: body.name },
      session: { token: 'mock-session-token' },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/session', () => {
    return HttpResponse.json({ user: mockUser });
  }),

  // Trees endpoints
  http.get('/api/trees', () => {
    return HttpResponse.json({ trees: [mockTree] });
  }),

  http.get('/api/trees/:id', ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      tree: mockTree,
      persons: [mockPerson],
      relationships: [mockRelationship],
    });
  }),

  http.post('/api/trees', async ({ request }) => {
    const body = await request.json() as { name_ar: string; name_en: string };
    return HttpResponse.json({
      tree: {
        ...mockTree,
        id: `tree-${Date.now()}`,
        name_ar: body.name_ar,
        name_en: body.name_en,
      },
    });
  }),

  http.put('/api/trees/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof mockTree>;
    return HttpResponse.json({
      tree: { ...mockTree, ...body, id: params.id as string },
    });
  }),

  http.delete('/api/trees/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Persons endpoints
  http.get('/api/persons', ({ request }) => {
    const url = new URL(request.url);
    const treeId = url.searchParams.get('tree_id');

    if (!treeId) {
      return HttpResponse.json(
        { error: 'tree_id is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ persons: [mockPerson] });
  }),

  http.get('/api/persons/:id', ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ person: mockPerson });
  }),

  http.post('/api/persons', async ({ request }) => {
    const body = await request.json() as Partial<typeof mockPerson>;
    return HttpResponse.json({
      person: {
        ...mockPerson,
        ...body,
        id: `person-${Date.now()}`,
      },
    });
  }),

  http.put('/api/persons/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof mockPerson>;
    return HttpResponse.json({
      person: { ...mockPerson, ...body, id: params.id as string },
    });
  }),

  http.delete('/api/persons/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Relationships endpoints
  http.post('/api/relationships', async ({ request }) => {
    const body = await request.json() as Partial<typeof mockRelationship>;
    return HttpResponse.json({
      relationship: {
        ...mockRelationship,
        ...body,
        id: `rel-${Date.now()}`,
      },
    });
  }),

  http.delete('/api/relationships/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Search endpoint
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return HttpResponse.json({ results: [] });
    }

    return HttpResponse.json({
      results: [
        { type: 'person', data: mockPerson },
      ],
    });
  }),
];
