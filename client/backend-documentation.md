# CodeLearning Backend Documentation for Frontend Development

## 1. Overview
The backend is built with Node.js/Express and uses:
- PostgreSQL for data storage
- Redis for caching
- JWT for authentication
- Jest for testing
- CI/CD pipeline with GitHub Actions

## 2. Authentication System

### 2.1 Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

### 2.2 Authentication Flow
- Users receive a JWT token on login/register
- Token must be included in Authorization header: `Bearer <token>`
- Token expiration: 24h
- Refresh tokens available for extended sessions

### 2.3 User Roles
- `user`: Regular student
- `admin`: Platform administrator

## 3. Core Features & Endpoints

### 3.1 Courses
```
GET    /api/courses                 # List courses (paginated)
GET    /api/courses/:id            # Course details with lessons
POST   /api/courses                # Create course (admin)
PUT    /api/courses/:id            # Update course (admin)
DELETE /api/courses/:id            # Delete course (admin)
```

#### Course Object Structure
```javascript
{
  id: number,
  title: string,
  description: string,
  difficulty_level: 'beginner' | 'intermediate' | 'advanced',
  duration_hours: number,
  status: 'draft' | 'published' | 'archived',
  created_at: string,
  updated_at: string,
  total_lessons?: number,
  enrolled_count?: number
}
```

### 3.2 Lessons
```
GET    /api/lessons/:id/detail     # Lesson details
POST   /api/lessons                # Create lesson (admin)
PUT    /api/lessons/:id            # Update lesson (admin)
PUT    /api/lessons/:id/status     # Update lesson status (admin)
PUT    /api/lessons/:id/complete   # Mark lesson as completed
DELETE /api/lessons/:id            # Delete lesson (admin)
```

#### Lesson Object Structure
```javascript
{
  id: number,
  course_id: number,
  title: string,
  content: string,
  content_format: 'markdown' | 'html',
  order_number: number,
  status: 'draft' | 'review' | 'published' | 'archived',
  version: number,
  meta_description?: string,
  estimated_minutes: number,
  created_at: string,
  updated_at: string
}
```

### 3.3 Enrollments
```
POST   /api/enrollments/:courseId          # Enroll in course
GET    /api/enrollments/my-courses         # User's enrolled courses
POST   /api/enrollments/:courseId/complete # Complete course
GET    /api/enrollments/course/:id/progress # Course progress
```

### 3.4 Progress Tracking
```javascript
{
  total_lessons: number,
  completed_lessons: number,
  progress_percentage: number,
  last_accessed: string,
  completed: boolean,
  completed_at?: string
}
```

### 3.5 Comments
```
GET    /api/comments/lesson/:lessonId # Get lesson comments
POST   /api/comments/lesson/:lessonId # Add comment
PUT    /api/comments/:id              # Update comment
DELETE /api/comments/:id              # Delete comment
```

### 3.6 Favorites
```
GET    /api/favorites               # Get user favorites
POST   /api/favorites/:courseId     # Add to favorites
DELETE /api/favorites/:courseId     # Remove from favorites
```

### 3.7 Search
```
GET    /api/search?q=query         # Global search
GET    /api/search/courses?q=query # Search courses
GET    /api/search/lessons?q=query # Search lessons
GET    /api/search/suggestions?q=query # Get search suggestions
```

### 3.8 User Profile & Dashboard
```
GET    /api/profile               # User profile
PUT    /api/profile              # Update profile
PUT    /api/profile/preferences  # Update preferences
GET    /api/dashboard/overview   # Dashboard data
```

## 4. Data Caching Strategy

### 4.1 Cached Resources
- Course listings: 5 minutes
- Course details: 5 minutes
- User progress: 5 minutes
- Dashboard data: 5 minutes
- Search results: 5 minutes

### 4.2 Cache Invalidation
- On course update
- On lesson completion
- On enrollment changes
- On user preference updates

## 5. Rate Limiting

### 5.1 Limits
```javascript
{
  general: '100 requests per 15 minutes',
  auth: '5 requests per 60 minutes',
  admin: '30 requests per 15 minutes'
}
```

## 6. Error Handling

### 6.1 Error Response Format
```javascript
{
  success: false,
  error: {
    message: string,
    code: string,
    statusCode: number,
    errors?: Array<{
      field: string,
      message: string,
      value?: any
    }>
  }
}
```

### 6.2 Common Error Codes
```javascript
{
  VALIDATION_ERROR: 422,
  AUTH_ERROR: 401,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500
}
```

## 7. Realtime Features (WebSocket)

### 7.1 Events
- Course updates
- New comments
- Progress updates
- System notifications

## 8. Frontend Integration Notes

### 8.1 Required Headers
```javascript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

### 8.2 Response Format
All successful responses follow:
```javascript
{
  success: true,
  data: any,
  message?: string
}
```

### 8.3 Pagination Format
```javascript
{
  data: Array<T>,
  pagination: {
    nextCursor: string | null,
    hasMore: boolean
  }
}
```

### 8.4 File Upload Endpoints
- Support multipart/form-data
- Maximum file size: 10MB
- Allowed types: images, PDFs, archives

### 8.5 Security Considerations
- All sensitive routes require authentication
- CORS configured for frontend domains
- XSS protection via content sanitization
- CSRF protection must be implemented

## 9. Testing Guide

### 9.1 API Endpoints
All endpoints have corresponding tests in:
- `tests/integration/`
- `tests/services/`

### 9.2 Test Coverage
Current coverage metrics:
- Statements: >80%
- Branches: >75%
- Functions: >85%
- Lines: >80%

## 10. Monitoring & Metrics

### 10.1 Available Metrics
```
/api/monitoring/metrics   # Prometheus metrics
/api/monitoring/health    # Health check
/api/monitoring/status    # System status
/api/monitoring/alerts    # System alerts
```

### 10.2 Monitored Aspects
- Request duration
- Error rates
- Cache hit rates
- Resource usage
- User activity

## 11. Environment Configuration
Required environment variables for frontend:
```
BACKEND_URL=http://localhost:5000
API_TIMEOUT=30000
WS_URL=ws://localhost:5000
```
