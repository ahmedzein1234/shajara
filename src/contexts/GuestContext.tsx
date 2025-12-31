'use client';

/**
 * Guest Tree Context
 *
 * Provides state management for guest (non-authenticated) tree building.
 * Allows users to try Shajara without creating an account first.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Person, Relationship } from '@/lib/db/schema';
import {
  GuestTree,
  GuestSession,
  getGuestStore,
  createGuestTree,
  addGuestPerson,
  updateGuestPerson,
  deleteGuestPerson,
  addGuestRelationship,
  deleteGuestRelationship,
  clearGuestData,
  hasGuestData,
  getGuestTreeAge,
  exportGuestDataForClaim,
} from '@/lib/guest/store';

interface GuestContextType {
  // State
  isGuest: boolean;
  tree: GuestTree | null;
  persons: Person[];
  relationships: Relationship[];
  session: GuestSession | null;
  isLoading: boolean;

  // Tree actions
  startGuestTree: (name: string, description?: string) => GuestTree;

  // Person actions
  addPerson: (person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => Person | null;
  removePerson: (id: string) => boolean;

  // Relationship actions
  addRelationship: (rel: Omit<Relationship, 'id' | 'created_at'>) => Relationship;
  removeRelationship: (id: string) => boolean;

  // Utility
  hasData: boolean;
  treeAge: number | null;
  exportForClaim: () => ReturnType<typeof exportGuestDataForClaim>;
  clearAll: () => void;
}

const GuestContext = createContext<GuestContextType | null>(null);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [tree, setTree] = useState<GuestTree | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load guest data on mount
  useEffect(() => {
    const store = getGuestStore();
    setTree(store.tree);
    setPersons(store.persons);
    setRelationships(store.relationships);
    setSession(store.session);
    setIsLoading(false);
  }, []);

  const startGuestTree = useCallback((name: string, description?: string) => {
    const newTree = createGuestTree(name, description);
    setTree(newTree);
    setPersons([]);
    setRelationships([]);
    return newTree;
  }, []);

  const addPerson = useCallback((personData: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => {
    const person = addGuestPerson(personData);
    setPersons(prev => [...prev, person]);
    return person;
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    const updated = updateGuestPerson(id, updates);
    if (updated) {
      setPersons(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  }, []);

  const removePerson = useCallback((id: string) => {
    const success = deleteGuestPerson(id);
    if (success) {
      setPersons(prev => prev.filter(p => p.id !== id));
      setRelationships(prev => prev.filter(r => r.person1_id !== id && r.person2_id !== id));
    }
    return success;
  }, []);

  const addRelationship = useCallback((relData: Omit<Relationship, 'id' | 'created_at'>) => {
    const relationship = addGuestRelationship(relData);
    setRelationships(prev => [...prev, relationship]);
    return relationship;
  }, []);

  const removeRelationship = useCallback((id: string) => {
    const success = deleteGuestRelationship(id);
    if (success) {
      setRelationships(prev => prev.filter(r => r.id !== id));
    }
    return success;
  }, []);

  const clearAll = useCallback(() => {
    clearGuestData();
    setTree(null);
    setPersons([]);
    setRelationships([]);
    setSession(null);
  }, []);

  const value: GuestContextType = {
    isGuest: tree?.isGuest ?? false,
    tree,
    persons,
    relationships,
    session,
    isLoading,
    startGuestTree,
    addPerson,
    updatePerson,
    removePerson,
    addRelationship,
    removeRelationship,
    hasData: hasGuestData(),
    treeAge: getGuestTreeAge(),
    exportForClaim: exportGuestDataForClaim,
    clearAll,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest(): GuestContextType {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}
