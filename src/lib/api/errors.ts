/**
 * API error handling utilities
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from 'next/server';
import { ValidationError } from './validation';
import { PermissionError } from '@/lib/permissions/api';

// =====================================================
// ERROR TYPES
// =====================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

// =====================================================
// ERROR RESPONSE INTERFACE
// =====================================================

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    field?: string;
    details?: any;
  };
  success: false;
}

// =====================================================
// ERROR HANDLER
// =====================================================

export function handleError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  // Validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code || 'VALIDATION_ERROR',
          field: error.field,
        },
        success: false,
      },
      { status: 400 }
    );
  }

  // Permission errors
  if (error instanceof PermissionError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'PERMISSION_DENIED',
        },
        success: false,
      },
      { status: 403 }
    );
  }

  // API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
        success: false,
      },
      { status: error.statusCode }
    );
  }

  // D1 Database errors
  if (error instanceof Error) {
    // Check for specific D1 errors
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        {
          error: {
            message: 'A record with this information already exists',
            code: 'DUPLICATE_ENTRY',
          },
          success: false,
        },
        { status: 409 }
      );
    }

    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        {
          error: {
            message: 'Referenced resource does not exist',
            code: 'FOREIGN_KEY_ERROR',
          },
          success: false,
        },
        { status: 400 }
      );
    }

    if (error.message.includes('NOT NULL constraint failed')) {
      return NextResponse.json(
        {
          error: {
            message: 'Required field is missing',
            code: 'REQUIRED_FIELD',
          },
          success: false,
        },
        { status: 400 }
      );
    }
  }

  // Generic error
  return NextResponse.json(
    {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
      },
      success: false,
    },
    { status: 500 }
  );
}

// =====================================================
// SUCCESS RESPONSE HELPERS
// =====================================================

export interface SuccessResponse<T = any> {
  data: T;
  success: true;
}

export function successResponse<T>(data: T, status: number = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      success: true,
    },
    { status }
  );
}

export function createdResponse<T>(data: T): NextResponse<SuccessResponse<T>> {
  return successResponse(data, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// =====================================================
// MIDDLEWARE HELPERS
// =====================================================

export function requireMethod(request: Request, allowedMethods: string[]): void {
  if (!allowedMethods.includes(request.method)) {
    throw new ApiError(
      `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      405,
      'METHOD_NOT_ALLOWED'
    );
  }
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new BadRequestError('Invalid JSON in request body');
  }
}

export function getSearchParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

// =====================================================
// CORS HELPERS
// =====================================================

export function corsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleOptions(origin?: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
