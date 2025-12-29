/**
 * MSW Server Setup
 * Creates a mock server for API testing
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
