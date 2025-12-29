/**
 * Trees API Integration Tests
 * Tests for tree CRUD operations via API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockTree, mockPerson } from '@/test/mocks/handlers';

// Mock fetch for API testing
const API_BASE = 'http://localhost:3000';

describe('Trees API', () => {
  describe('GET /api/trees', () => {
    it('should return list of trees', async () => {
      const response = await fetch(`${API_BASE}/api/trees`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.trees).toBeInstanceOf(Array);
      expect(data.trees.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/trees/:id', () => {
    it('should return tree with persons and relationships', async () => {
      const response = await fetch(`${API_BASE}/api/trees/tree-1`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.tree).toBeDefined();
      expect(data.tree.id).toBe('tree-1');
      expect(data.persons).toBeInstanceOf(Array);
      expect(data.relationships).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent tree', async () => {
      const response = await fetch(`${API_BASE}/api/trees/not-found`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/trees', () => {
    it('should create a new tree', async () => {
      const response = await fetch(`${API_BASE}/api/trees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ar: 'شجرة جديدة',
          name_en: 'New Tree',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.tree).toBeDefined();
      expect(data.tree.name_ar).toBe('شجرة جديدة');
      expect(data.tree.name_en).toBe('New Tree');
    });
  });

  describe('PUT /api/trees/:id', () => {
    it('should update an existing tree', async () => {
      const response = await fetch(`${API_BASE}/api/trees/tree-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ar: 'اسم محدث',
          name_en: 'Updated Name',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.tree.name_ar).toBe('اسم محدث');
    });
  });

  describe('DELETE /api/trees/:id', () => {
    it('should delete a tree', async () => {
      const response = await fetch(`${API_BASE}/api/trees/tree-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });
});

describe('Persons API', () => {
  describe('GET /api/persons', () => {
    it('should return persons for a tree', async () => {
      const response = await fetch(`${API_BASE}/api/persons?tree_id=tree-1`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.persons).toBeInstanceOf(Array);
    });

    it('should return 400 without tree_id', async () => {
      const response = await fetch(`${API_BASE}/api/persons`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/persons/:id', () => {
    it('should return a single person', async () => {
      const response = await fetch(`${API_BASE}/api/persons/person-1`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.person).toBeDefined();
      expect(data.person.id).toBe('person-1');
    });

    it('should return 404 for non-existent person', async () => {
      const response = await fetch(`${API_BASE}/api/persons/not-found`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/persons', () => {
    it('should create a new person', async () => {
      const response = await fetch(`${API_BASE}/api/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree_id: 'tree-1',
          given_name: 'Mohammed',
          gender: 'male',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.person).toBeDefined();
      expect(data.person.given_name).toBe('Mohammed');
    });
  });

  describe('PUT /api/persons/:id', () => {
    it('should update a person', async () => {
      const response = await fetch(`${API_BASE}/api/persons/person-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          given_name: 'Updated Name',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.person.given_name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/persons/:id', () => {
    it('should delete a person', async () => {
      const response = await fetch(`${API_BASE}/api/persons/person-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });
});

describe('Relationships API', () => {
  describe('POST /api/relationships', () => {
    it('should create a relationship', async () => {
      const response = await fetch(`${API_BASE}/api/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree_id: 'tree-1',
          person1_id: 'person-1',
          person2_id: 'person-2',
          relationship_type: 'parent_child',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.relationship).toBeDefined();
    });
  });

  describe('DELETE /api/relationships/:id', () => {
    it('should delete a relationship', async () => {
      const response = await fetch(`${API_BASE}/api/relationships/rel-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });
});

describe('Search API', () => {
  describe('GET /api/search', () => {
    it('should return search results', async () => {
      const response = await fetch(`${API_BASE}/api/search?q=Ahmed`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.results).toBeInstanceOf(Array);
    });

    it('should return empty results for no query', async () => {
      const response = await fetch(`${API_BASE}/api/search`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.results).toEqual([]);
    });
  });
});

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          name: 'New User',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.user).toBeDefined();
    });

    it('should reject existing email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'SecurePassword123!',
          name: 'Existing User',
        }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return current session', async () => {
      const response = await fetch(`${API_BASE}/api/auth/session`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.user).toBeDefined();
    });
  });
});
