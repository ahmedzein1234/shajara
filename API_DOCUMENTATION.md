# Shajara API Documentation

Complete REST API documentation for the Shajara Arabic Family Tree application.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Trees](#trees)
  - [Persons](#persons)
  - [Relationships](#relationships)
  - [Search](#search)
  - [Upload](#upload)
  - [Export](#export)

## Overview

The Shajara API is built with Next.js 15 and runs on Cloudflare Pages with Edge runtime. It uses:

- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for media files
- **Runtime**: Edge runtime for optimal performance
- **Format**: JSON for requests and responses
- **Encoding**: UTF-8 with full Arabic support

## Authentication

Currently, the API uses a simple header-based authentication for development:

```http
X-User-Id: your-user-uuid
```

Or as a query parameter:

```
?user_id=your-user-uuid
```

**TODO**: Implement proper authentication using Cloudflare Access, JWT tokens, or OAuth.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "field": "field_name"
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Validation error or malformed request
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate entry or constraint violation
- `500 Internal Server Error` - Server error

## Error Handling

All errors follow a consistent format with these error codes:

- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource doesn't exist
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `BAD_REQUEST` - Invalid request
- `CONFLICT` - Duplicate or conflicting data
- `DUPLICATE_ENTRY` - Unique constraint violation
- `FOREIGN_KEY_ERROR` - Referenced resource doesn't exist
- `INTERNAL_SERVER_ERROR` - Unexpected server error

---

## API Endpoints

## Trees

### List User's Trees

Get all trees owned by the current user.

**Endpoint**: `GET /api/trees`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "عائلة القحطاني",
      "description": "شجرة عائلة القحطاني",
      "is_public": false,
      "created_at": 1734528000,
      "updated_at": 1734528000
    }
  ]
}
```

### Create New Tree

Create a new family tree.

**Endpoint**: `POST /api/trees`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "عائلة القحطاني",
  "description": "شجرة عائلة القحطاني من الرياض",
  "is_public": false
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "عائلة القحطاني",
    "description": "شجرة عائلة القحطاني من الرياض",
    "is_public": false,
    "created_at": 1734528000,
    "updated_at": 1734528000
  }
}
```

### Get Tree with Persons

Get a specific tree with all persons.

**Endpoint**: `GET /api/trees/:id`

**Authentication**: Required (for private trees) or public access (for public trees)

**Response**:
```json
{
  "success": true,
  "data": {
    "tree": {
      "id": "uuid",
      "user_id": "uuid",
      "name": "عائلة القحطاني",
      "description": "شجرة عائلة القحطاني",
      "is_public": true,
      "created_at": 1734528000,
      "updated_at": 1734528000
    },
    "persons": [
      {
        "id": "uuid",
        "tree_id": "uuid",
        "given_name": "محمد",
        "patronymic_chain": "بن خالد بن محمد",
        "family_name": "القحطاني",
        "full_name_ar": "محمد بن خالد بن محمد القحطاني",
        "full_name_en": "Mohammed bin Khaled bin Mohammed Al-Qahtani",
        "gender": "male",
        "birth_date": "1990-05-15",
        "birth_place": "الرياض",
        "birth_place_lat": 24.7136,
        "birth_place_lng": 46.6753,
        "death_date": null,
        "death_place": null,
        "death_place_lat": null,
        "death_place_lng": null,
        "is_living": true,
        "photo_url": "https://...",
        "notes": "ملاحظات إضافية",
        "created_at": 1734528000,
        "updated_at": 1734528000
      }
    ]
  }
}
```

### Update Tree

Update tree metadata.

**Endpoint**: `PUT /api/trees/:id`

**Authentication**: Required (owner only)

**Request Body** (all fields optional):
```json
{
  "name": "Updated name",
  "description": "Updated description",
  "is_public": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Updated name",
    "description": "Updated description",
    "is_public": true,
    "created_at": 1734528000,
    "updated_at": 1734529000
  }
}
```

### Delete Tree

Delete a tree and all associated data (persons, relationships, etc.).

**Endpoint**: `DELETE /api/trees/:id`

**Authentication**: Required (owner only)

**Response**: `204 No Content`

---

## Persons

### Create Person

Add a new person to a tree.

**Endpoint**: `POST /api/persons`

**Authentication**: Required (tree owner only)

**Request Body**:
```json
{
  "tree_id": "uuid",
  "given_name": "محمد",
  "patronymic_chain": "بن خالد بن محمد",
  "family_name": "القحطاني",
  "full_name_ar": "محمد بن خالد بن محمد القحطاني",
  "full_name_en": "Mohammed bin Khaled bin Mohammed Al-Qahtani",
  "gender": "male",
  "birth_date": "1990-05-15",
  "birth_place": "الرياض",
  "birth_place_lat": 24.7136,
  "birth_place_lng": 46.6753,
  "is_living": true,
  "photo_url": "https://...",
  "notes": "ملاحظات إضافية"
}
```

**Required Fields**:
- `tree_id`
- `given_name`
- `gender` ("male" or "female")

**Optional Fields**:
- `patronymic_chain` - سلسلة النسب (e.g., "بن خالد بن محمد")
- `family_name` - اسم العائلة (e.g., "القحطاني")
- `full_name_ar` - Full Arabic name
- `full_name_en` - English transliteration
- `birth_date` - ISO 8601 or Hijri date string
- `birth_place` - Place name
- `birth_place_lat` - Latitude (-90 to 90)
- `birth_place_lng` - Longitude (-180 to 180)
- `death_date` - Date of death
- `death_place` - Place of death
- `death_place_lat` - Death location latitude
- `death_place_lng` - Death location longitude
- `is_living` - Boolean, defaults to true
- `photo_url` - URL to profile photo
- `notes` - Additional notes

**Response**: `201 Created`

### Get Person Details

Get person information with relationships.

**Endpoint**: `GET /api/persons/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "person": {
      "id": "uuid",
      "tree_id": "uuid",
      "given_name": "محمد",
      // ... all person fields
    },
    "relationships": [
      {
        "id": "uuid",
        "tree_id": "uuid",
        "person1_id": "uuid",
        "person2_id": "uuid",
        "relationship_type": "parent",
        "marriage_date": null,
        "marriage_place": null,
        "divorce_date": null,
        "divorce_place": null,
        "created_at": 1734528000
      }
    ]
  }
}
```

### Update Person

Update person information.

**Endpoint**: `PUT /api/persons/:id`

**Authentication**: Required (tree owner only)

**Request Body** (all fields optional):
```json
{
  "given_name": "محمد",
  "full_name_ar": "محمد بن خالد بن محمد القحطاني",
  "photo_url": "https://...",
  "notes": "Updated notes"
}
```

**Response**: Updated person object

### Delete Person

Delete a person and all their relationships.

**Endpoint**: `DELETE /api/persons/:id`

**Authentication**: Required (tree owner only)

**Response**: `204 No Content`

---

## Relationships

### List Relationships

Get all relationships in a tree.

**Endpoint**: `GET /api/relationships?tree_id=uuid`

**Query Parameters**:
- `tree_id` (required) - Tree UUID

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tree_id": "uuid",
      "person1_id": "uuid",
      "person2_id": "uuid",
      "relationship_type": "parent",
      "marriage_date": null,
      "marriage_place": null,
      "divorce_date": null,
      "divorce_place": null,
      "created_at": 1734528000
    }
  ]
}
```

### Create Relationship

Create a relationship between two persons.

**Endpoint**: `POST /api/relationships`

**Authentication**: Required (tree owner only)

**Request Body**:
```json
{
  "tree_id": "uuid",
  "person1_id": "uuid",
  "person2_id": "uuid",
  "relationship_type": "spouse",
  "marriage_date": "2010-06-15",
  "marriage_place": "الرياض"
}
```

**Relationship Types**:
- `parent` - person1 is parent of person2
- `spouse` - person1 is spouse of person2 (bidirectional)
- `sibling` - person1 is sibling of person2 (bidirectional)

**Marriage Fields** (optional, for spouse relationships):
- `marriage_date` - Date of marriage
- `marriage_place` - Place of marriage
- `divorce_date` - Date of divorce (if applicable)
- `divorce_place` - Place of divorce (if applicable)

**Response**: `201 Created`

### Delete Relationship

Remove a relationship.

**Endpoint**: `DELETE /api/relationships/:id`

**Authentication**: Required (tree owner only)

**Response**: `204 No Content`

---

## Search

### Search Persons

Search for persons using full-text search across all name fields.

**Endpoint**: `GET /api/search`

**Query Parameters**:
- `query` - Search text (optional)
- `tree_id` - Filter by tree UUID (optional)
- `gender` - Filter by gender: "male" or "female" (optional)
- `is_living` - Filter by living status: "true" or "false" (optional)
- `limit` - Results per page: 1-100 (default: 50)
- `offset` - Pagination offset (default: 0)

**Example Searches**:
```
/api/search?query=محمد
/api/search?query=Mohammed
/api/search?query=القحطاني&tree_id=uuid
/api/search?tree_id=uuid&gender=male&is_living=true&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "persons": [
      {
        "id": "uuid",
        "tree_id": "uuid",
        "given_name": "محمد",
        // ... full person object
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Search Features**:
- Uses SQLite FTS5 for fast full-text search
- Searches across: given_name, patronymic_chain, family_name, full_name_ar, full_name_en
- Supports both Arabic and English queries
- Case-insensitive
- Supports Arabic diacritics

---

## Upload

### Upload Photo

Upload a photo to Cloudflare R2 storage.

**Endpoint**: `POST /api/upload`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `file` (required) - The image file to upload
- `tree_id` (optional) - Tree UUID for organization

**Allowed File Types**:
- image/jpeg
- image/jpg
- image/png
- image/webp
- image/gif

**Maximum File Size**: 10MB

**Example** (using FormData):
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('tree_id', 'tree-uuid');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'X-User-Id': 'user-uuid'
  },
  body: formData
});
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "url": "https://shajara-media.r2.dev/uploads/user-id/timestamp-random.jpg",
    "key": "uploads/user-id/timestamp-random.jpg",
    "size": 45678,
    "type": "image/jpeg"
  }
}
```

---

## Export

### Export as GEDCOM

Export a family tree in GEDCOM 5.5.1 format.

**Endpoint**: `GET /api/export/:treeId`

**Authentication**: Required (owner) or public access (for public trees)

**Response**: `200 OK`

**Content-Type**: `text/plain; charset=utf-8`

**Content-Disposition**: `attachment; filename="tree-name.ged"`

**GEDCOM Format**:
- Standard: GEDCOM 5.5.1
- Encoding: UTF-8
- Includes: All persons, relationships, dates, places, notes, photos
- Supports: Arabic names, GPS coordinates, marriage/divorce info

**Example**:
```
GET /api/export/tree-uuid
```

Downloads file: `عائلة_القحطاني.ged`

**GEDCOM Features**:
- Individual records with Arabic and English names
- Family records with spouse and parent-child relationships
- Birth/death events with dates and GPS coordinates
- Marriage and divorce information
- Notes and photo URLs
- Compatible with major genealogy software

---

## Implementation Notes

### Edge Runtime

All routes use Cloudflare Edge runtime:
```typescript
export const runtime = 'edge';
```

### Database Access

Access D1 database from request context:
```typescript
const db = getDatabase(request);
```

### Validation

All input is validated using validation schemas:
```typescript
import { validateCreatePerson } from '@/lib/api/validation';
const validated = validateCreatePerson(requestBody);
```

### Error Handling

Consistent error handling across all routes:
```typescript
try {
  // Route logic
} catch (error) {
  return handleError(error);
}
```

### Authorization

All routes verify ownership before mutations:
```typescript
const isOwner = await verifyTreeOwnership(db, treeId, userId);
if (!isOwner) {
  throw new ForbiddenError('Permission denied');
}
```

---

## Development

### Testing with curl

**Create a tree**:
```bash
curl -X POST http://localhost:3000/api/trees \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-uuid" \
  -d '{"name":"My Tree","is_public":false}'
```

**Search persons**:
```bash
curl "http://localhost:3000/api/search?query=محمد&limit=10"
```

**Upload photo**:
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "X-User-Id: your-uuid" \
  -F "file=@photo.jpg"
```

### Local Development

1. Install dependencies: `npm install`
2. Run migrations: `npm run db:migrate`
3. Start dev server: `npm run dev`
4. API available at: `http://localhost:3000/api`

### Deployment

Deploy to Cloudflare Pages:
```bash
npm run deploy
```

---

## Future Enhancements

- [ ] Implement proper authentication (JWT, OAuth, Cloudflare Access)
- [ ] Add rate limiting
- [ ] Add API versioning
- [ ] Add webhook support for events
- [ ] Add bulk operations
- [ ] Add import from GEDCOM
- [ ] Add media management (galleries, videos)
- [ ] Add collaborative editing with permissions
- [ ] Add tree sharing and invitations
- [ ] Add activity logs and audit trails
