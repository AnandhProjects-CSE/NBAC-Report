# NBAC Backend API Documentation

## Complete API Reference Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [API Endpoints](#api-endpoints)
   - [Authentication Routes](#1-authentication-routes)
   - [User Routes](#2-user-routes)
   - [Course Routes](#3-course-routes)
   - [Course Outcome Routes](#4-course-outcome-routes)
   - [CO-PO Matrix Routes](#5-co-po-matrix-routes)
   - [Marks Routes](#6-marks-routes)
   - [Feedback Routes](#7-feedback-routes)
   - [Attainment Routes](#8-attainment-routes)
   - [Report Routes](#9-report-routes)

---

## Overview

**Base URL:** `http://localhost:5000/api`

**Authentication:** JWT Bearer Token (include in Authorization header)

**Content-Type:** `application/json`

---

## Authentication

All protected routes require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { }
}
```

### Success Response with Pagination

```json
{
  "success": true,
  "message": "Success message",
  "data": [],
  "meta": {
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "fieldName", "message": "Specific error message" }
  ]
}
```

---

## API Endpoints

---

## 1. Authentication Routes

**Base Path:** `/api/auth`

### 1.1 Register User

**POST** `/api/auth/register`

**Access:** Admin only

**Description:** Register a new user (admin, faculty, or student)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name (max 100 chars) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 characters) |
| role | string | Yes | One of: `admin`, `faculty`, `student` |
| department | string | Yes | Department name |
| year | number | Required for students | Academic year (1-4) |
| section | string | Required for students | Section identifier (e.g., "A") |
| rollNumber | string | Optional for students | Student roll number |

**Request Example:**

```json
{
  "name": "John Doe",
  "email": "john.doe@nbac.edu",
  "password": "password123",
  "role": "faculty",
  "department": "Computer Science"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "John Doe",
      "email": "john.doe@nbac.edu",
      "role": "faculty",
      "department": "Computer Science",
      "isActive": true,
      "isApproved": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 1.2 Login

**POST** `/api/auth/login`

**Access:** Public

**Description:** Authenticate user and receive tokens

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Request Example:**

```json
{
  "email": "john.doe@nbac.edu",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "John Doe",
      "email": "john.doe@nbac.edu",
      "role": "faculty",
      "department": "Computer Science"
    }
  }
}
```

---

### 1.3 Refresh Token

**POST** `/api/auth/refresh`

**Access:** Public

**Description:** Get new access token using refresh token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token |

**Request Example:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.4 Logout

**POST** `/api/auth/logout`

**Access:** Protected (All authenticated users)

**Description:** Invalidate refresh token

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.5 Get Current User Profile

**GET** `/api/auth/me`

**Access:** Protected (All authenticated users)

**Description:** Get the profile of the currently authenticated user

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "John Doe",
      "email": "john.doe@nbac.edu",
      "role": "faculty",
      "department": "Computer Science",
      "isActive": true,
      "isApproved": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 1.6 Update Current User Profile

**PATCH** `/api/auth/me`

**Access:** Protected (All authenticated users)

**Description:** Update the current user's profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | User's full name (max 100 chars) |
| password | string | No | New password (min 6 characters) |

**Request Example:**

```json
{
  "name": "John Updated Doe"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "John Updated Doe",
      "email": "john.doe@nbac.edu",
      "role": "faculty",
      "department": "Computer Science"
    }
  }
}
```

---

## 2. User Routes

**Base Path:** `/api/users`

All routes in this section require Admin role.

---

### 2.1 Get All Users

**GET** `/api/users`

**Access:** Admin only

**Description:** Get paginated list of all users with optional filtering

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| role | string | - | Filter by role (`admin`, `faculty`, `student`) |
| department | string | - | Filter by department (case-insensitive regex) |
| isActive | boolean | - | Filter by active status |

**Example Request:**
```
GET /api/users?page=1&limit=10&role=student&department=Computer&isActive=true
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "6799123456789abcdef01234",
      "name": "Student Name",
      "email": "student@nbac.edu",
      "role": "student",
      "department": "Computer Science",
      "year": 2,
      "section": "A",
      "rollNumber": "22CS101",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 2.2 Get User by ID

**GET** `/api/users/:id`

**Access:** Admin only

**Description:** Get detailed information about a specific user

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's MongoDB ObjectId |

**Example Request:**
```
GET /api/users/6799123456789abcdef01234
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "Faculty Name",
      "email": "faculty@nbac.edu",
      "role": "faculty",
      "department": "Computer Science",
      "isActive": true
    },
    "coursesCount": 5
  }
}
```

---

### 2.3 Update User

**PATCH** `/api/users/:id`

**Access:** Admin only

**Description:** Update user information

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | User's name |
| department | string | No | Department |
| year | number | No | Year (students only, 1-4) |
| section | string | No | Section (students only) |
| rollNumber | string | No | Roll number (students only) |
| isActive | boolean | No | Active status |
| isApproved | boolean | No | Approval status |

**Request Example:**

```json
{
  "name": "Updated Name",
  "section": "B"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "Updated Name",
      "email": "student@nbac.edu",
      "role": "student",
      "department": "Computer Science",
      "year": 2,
      "section": "B"
    }
  }
}
```

---

### 2.4 Delete User (Soft Delete)

**DELETE** `/api/users/:id`

**Access:** Admin only

**Description:** Soft delete a user (sets isActive to false)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

### 2.5 Restore Deleted User

**POST** `/api/users/:id/restore`

**Access:** Admin only

**Description:** Restore a soft-deleted user

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "user": {
      "_id": "6799123456789abcdef01234",
      "name": "Restored User",
      "email": "user@nbac.edu",
      "role": "student",
      "isActive": true
    }
  }
}
```

---

### 2.6 Reset User Password

**POST** `/api/users/:id/reset-password`

**Access:** Admin only

**Description:** Reset a user's password

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newPassword | string | Yes | New password (min 6 characters) |

**Request Example:**

```json
{
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 2.7 Get Unenrolled Students for Course

**GET** `/api/users/students/unenrolled/:courseId`

**Access:** Faculty (owner), Admin

**Description:** Get list of students not enrolled in a specific course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| year | number | Filter by year |
| section | string | Filter by section |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Unenrolled students retrieved",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures"
    },
    "students": [
      {
        "_id": "6799123456789abcdef01234",
        "name": "Unenrolled Student",
        "email": "student@nbac.edu",
        "rollNumber": "22CS105",
        "year": 3,
        "section": "A"
      }
    ],
    "count": 1
  }
}
```

---

## 3. Course Routes

**Base Path:** `/api/courses`

---

### 3.1 Create Course

**POST** `/api/courses`

**Access:** Faculty, Admin

**Description:** Create a new course

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| courseCode | string | Yes | Course code (max 20 chars, e.g., "CS301") |
| courseName | string | Yes | Course name (max 200 chars) |
| department | string | Yes | Department name |
| semester | number | Yes | Semester (1-8) |
| academicYear | string | Yes | Academic year in format YYYY-YY |
| facultyId | string | Yes | Faculty's MongoDB ObjectId |
| credits | number | No | Credits (1-10, default: 3) |
| description | string | No | Course description |
| enrolledStudents | array | No | Array of student MongoDB ObjectIds |

**Request Example:**

```json
{
  "courseCode": "CS301",
  "courseName": "Data Structures and Algorithms",
  "department": "Computer Science",
  "semester": 5,
  "academicYear": "2024-25",
  "facultyId": "6799123456789abcdef01234",
  "credits": 4,
  "description": "Study of fundamental data structures"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures and Algorithms",
      "department": "Computer Science",
      "semester": 5,
      "academicYear": "2024-25",
      "facultyId": {
        "_id": "6799123456789abcdef01234",
        "name": "Dr. John Smith",
        "email": "john.smith@nbac.edu",
        "department": "Computer Science"
      },
      "enrolledStudents": [],
      "isActive": true,
      "credits": 4,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "enrolledCount": 0
  }
}
```

---

### 3.2 Get All Courses

**GET** `/api/courses`

**Access:** Faculty, Admin

**Description:** Get paginated list of courses. Faculty sees only their own courses; Admin sees all.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| semester | number | - | Filter by semester |
| academicYear | string | - | Filter by academic year |
| department | string | - | Filter by department |
| facultyId | string | - | Filter by faculty (Admin only) |
| isActive | boolean | - | Filter by active status |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures",
      "department": "Computer Science",
      "semester": 5,
      "academicYear": "2024-25",
      "facultyId": {
        "_id": "6799123456789abcdef01234",
        "name": "Dr. John Smith",
        "email": "john.smith@nbac.edu"
      },
      "enrolledStudents": [],
      "isActive": true,
      "credits": 4
    }
  ],
  "meta": {
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### 3.3 Get Student's Enrolled Courses

**GET** `/api/courses/student/my-courses`

**Access:** Student only

**Description:** Get list of courses the student is enrolled in

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Enrolled courses retrieved",
  "data": {
    "courses": [
      {
        "_id": "6799abcdef01234567890123",
        "courseCode": "CS301",
        "courseName": "Data Structures",
        "semester": 5,
        "academicYear": "2024-25",
        "facultyId": {
          "_id": "6799123456789abcdef01234",
          "name": "Dr. John Smith",
          "email": "john.smith@nbac.edu"
        },
        "credits": 4
      }
    ],
    "count": 1
  }
}
```

---

### 3.4 Get Course by ID

**GET** `/api/courses/:id`

**Access:** Faculty (owner), Admin

**Description:** Get detailed information about a specific course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures",
      "department": "Computer Science",
      "semester": 5,
      "academicYear": "2024-25",
      "facultyId": {
        "_id": "6799123456789abcdef01234",
        "name": "Dr. John Smith",
        "email": "john.smith@nbac.edu",
        "department": "Computer Science"
      },
      "enrolledStudents": [
        {
          "_id": "6799student1234567890abcd",
          "name": "Student Name",
          "email": "student@nbac.edu",
          "rollNumber": "22CS101",
          "year": 3,
          "section": "A"
        }
      ],
      "isActive": true,
      "credits": 4,
      "description": "Study of data structures"
    },
    "coCount": 5,
    "hasMatrix": true,
    "marksRecordsCount": 4,
    "hasAttainment": true,
    "attainmentGeneratedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

---

### 3.5 Update Course

**PATCH** `/api/courses/:id`

**Access:** Faculty (owner), Admin

**Description:** Update course information

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Course's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| courseName | string | No | Course name |
| semester | number | No | Semester (1-8) |
| academicYear | string | No | Academic year (YYYY-YY) |
| facultyId | string | No | New faculty's MongoDB ObjectId |
| credits | number | No | Credits (1-10) |
| description | string | No | Course description |
| isActive | boolean | No | Active status |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Updated Course Name",
      "isActive": true
    }
  }
}
```

---

### 3.6 Delete Course (Soft Delete)

**DELETE** `/api/courses/:id`

**Access:** Admin only

**Description:** Soft delete a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Course's MongoDB ObjectId |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| force | string | Set to "true" to delete even with attainment data |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course deactivated successfully"
}
```

---

### 3.7 Enroll Students

**POST** `/api/courses/:id/enroll`

**Access:** Faculty (owner), Admin

**Description:** Enroll multiple students in a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Course's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| studentIds | array | Yes | Array of student MongoDB ObjectIds |

**Request Example:**

```json
{
  "studentIds": [
    "6799student1234567890abcd",
    "6799student1234567890abce"
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Students enrolled successfully",
  "data": {
    "enrolledCount": 2,
    "alreadyEnrolledCount": 0,
    "invalidCount": 0,
    "alreadyEnrolled": [],
    "invalidIds": []
  }
}
```

---

### 3.8 Remove Student from Course

**DELETE** `/api/courses/:id/enroll/:studentId`

**Access:** Faculty (owner), Admin

**Description:** Remove a student from a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Course's MongoDB ObjectId |
| studentId | string | Student's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Student removed from course"
}
```

---

## 4. Course Outcome Routes

**Base Path:** `/api/courses/:courseId/cos`

---

### 4.1 Add Course Outcome

**POST** `/api/courses/:courseId/cos`

**Access:** Faculty (owner), Admin

**Description:** Add a single Course Outcome to a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| coNumber | string | Yes | CO number in format "CO1", "CO2", etc. |
| description | string | Yes | CO description (max 500 chars) |
| threshold | number | No | Threshold percentage (0-100, default: 60) |

**Request Example:**

```json
{
  "coNumber": "CO1",
  "description": "Analyze the complexity of algorithms using asymptotic notation",
  "threshold": 60
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Course Outcome added successfully",
  "data": {
    "co": {
      "_id": "6799co1234567890abcdef",
      "courseId": "6799abcdef01234567890123",
      "coNumber": "CO1",
      "description": "Analyze the complexity of algorithms",
      "threshold": 60,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4.2 Batch Create Course Outcomes

**POST** `/api/courses/:courseId/cos/batch`

**Access:** Faculty (owner), Admin

**Description:** Create multiple Course Outcomes at once

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cos | array | Yes | Array of CO objects |

**Request Example:**

```json
{
  "cos": [
    {
      "coNumber": "CO1",
      "description": "First CO description",
      "threshold": 60
    },
    {
      "coNumber": "CO2",
      "description": "Second CO description",
      "threshold": 65
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Course Outcomes created successfully",
  "data": {
    "cos": [
      {
        "_id": "6799co1234567890abcdef",
        "courseId": "6799abcdef01234567890123",
        "coNumber": "CO1",
        "description": "First CO description",
        "threshold": 60
      },
      {
        "_id": "6799co1234567890abcdeg",
        "courseId": "6799abcdef01234567890123",
        "coNumber": "CO2",
        "description": "Second CO description",
        "threshold": 65
      }
    ],
    "count": 2
  }
}
```

---

### 4.3 Get All Course Outcomes

**GET** `/api/courses/:courseId/cos`

**Access:** Faculty, Admin

**Description:** Get all Course Outcomes for a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course Outcomes retrieved successfully",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures"
    },
    "cos": [
      {
        "_id": "6799co1234567890abcdef",
        "courseId": "6799abcdef01234567890123",
        "coNumber": "CO1",
        "description": "First CO description",
        "threshold": 60,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### 4.4 Get Single Course Outcome

**GET** `/api/courses/:courseId/cos/:coId`

**Access:** Faculty, Admin

**Description:** Get a specific Course Outcome

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |
| coId | string | Course Outcome's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course Outcome retrieved",
  "data": {
    "co": {
      "_id": "6799co1234567890abcdef",
      "courseId": "6799abcdef01234567890123",
      "coNumber": "CO1",
      "description": "CO description",
      "threshold": 60
    }
  }
}
```

---

### 4.5 Update Course Outcome

**PATCH** `/api/courses/:courseId/cos/:coId`

**Access:** Faculty (owner), Admin

**Description:** Update a Course Outcome

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |
| coId | string | Course Outcome's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| description | string | No | Updated description |
| threshold | number | No | Updated threshold (0-100) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course Outcome updated successfully",
  "data": {
    "co": {
      "_id": "6799co1234567890abcdef",
      "coNumber": "CO1",
      "description": "Updated description",
      "threshold": 65
    }
  }
}
```

---

### 4.6 Delete Course Outcome

**DELETE** `/api/courses/:courseId/cos/:coId`

**Access:** Faculty (owner), Admin

**Description:** Delete a Course Outcome (only if no marks/attainment linked)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |
| coId | string | Course Outcome's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Course Outcome deleted successfully"
}
```

---

## 5. CO-PO Matrix Routes

**Base Path:** `/api/courses/:courseId/matrix`

---

### 5.1 Create/Update CO-PO Matrix

**POST** `/api/courses/:courseId/matrix`

**Access:** Faculty (owner), Admin

**Description:** Create or replace the CO-PO correlation matrix

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rows | array | Yes | Array of matrix rows |

Each row object:

| Field | Type | Description |
|-------|------|-------------|
| coId | string | CO's MongoDB ObjectId |
| coNumber | string | CO number (e.g., "CO1") |
| po1-po12 | number | Correlation values (0-3) |

**Request Example:**

```json
{
  "rows": [
    {
      "coNumber": "CO1",
      "po1": 3,
      "po2": 3,
      "po3": 2,
      "po4": 1,
      "po5": 2,
      "po6": 0,
      "po7": 0,
      "po8": 0,
      "po9": 1,
      "po10": 1,
      "po11": 0,
      "po12": 2
    },
    {
      "coNumber": "CO2",
      "po1": 3,
      "po2": 2,
      "po3": 3,
      "po4": 2,
      "po5": 3,
      "po6": 0,
      "po7": 0,
      "po8": 0,
      "po9": 2,
      "po10": 1,
      "po11": 1,
      "po12": 1
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "CO-PO matrix saved successfully",
  "data": {
    "matrix": {
      "_id": "6799matrix1234567890ab",
      "courseId": "6799abcdef01234567890123",
      "rows": [
        {
          "coId": "6799co1234567890abcdef",
          "coNumber": "CO1",
          "po1": 3,
          "po2": 3,
          "po3": 2,
          "po4": 1,
          "po5": 2,
          "po6": 0,
          "po7": 0,
          "po8": 0,
          "po9": 1,
          "po10": 1,
          "po11": 0,
          "po12": 2
        }
      ],
      "updatedBy": "6799123456789abcdef01234",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "poNames": {
      "PO1": "Engineering Knowledge",
      "PO2": "Problem Analysis",
      "PO3": "Design/Development of Solutions",
      "PO4": "Conduct Investigations",
      "PO5": "Modern Tool Usage",
      "PO6": "The Engineer and Society",
      "PO7": "Environment and Sustainability",
      "PO8": "Ethics",
      "PO9": "Individual and Team Work",
      "PO10": "Communication",
      "PO11": "Project Management and Finance",
      "PO12": "Life-long Learning"
    }
  }
}
```

---

### 5.2 Get CO-PO Matrix

**GET** `/api/courses/:courseId/matrix`

**Access:** Faculty, Admin

**Description:** Get the CO-PO matrix for a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "CO-PO matrix retrieved successfully",
  "data": {
    "matrix": {
      "_id": "6799matrix1234567890ab",
      "courseId": "6799abcdef01234567890123",
      "rows": [
        {
          "coId": {
            "_id": "6799co1234567890abcdef",
            "coNumber": "CO1",
            "description": "CO Description"
          },
          "coNumber": "CO1",
          "po1": 3,
          "po2": 3,
          "po3": 2,
          "po4": 1,
          "po5": 2,
          "po6": 0,
          "po7": 0,
          "po8": 0,
          "po9": 1,
          "po10": 1,
          "po11": 0,
          "po12": 2
        }
      ]
    },
    "poNames": { }
  }
}
```

---

### 5.3 Upload Matrix via Excel

**POST** `/api/courses/:courseId/matrix/upload`

**Access:** Faculty (owner), Admin

**Description:** Upload CO-PO matrix via Excel file

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Excel file (.xlsx, .xls) |

**Expected Excel Format:**

| CO | PO1 | PO2 | PO3 | ... | PO12 |
|----|-----|-----|-----|-----|------|
| CO1 | 3 | 2 | 0 | ... | 1 |
| CO2 | 0 | 3 | 2 | ... | 0 |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "CO-PO matrix uploaded successfully",
  "data": {
    "matrix": { },
    "summary": {
      "totalCOs": 5,
      "uploadedRows": 5,
      "missingCOs": 0
    }
  }
}
```

---

### 5.4 Download Matrix Template

**GET** `/api/courses/:courseId/matrix/template`

**Access:** Faculty, Admin

**Description:** Download Excel template for CO-PO matrix

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response:** Excel file download (`.xlsx`)

---

## 6. Marks Routes

**Base Path:** `/api/courses/:courseId/marks`

---

### 6.1 Upload Marks via Excel

**POST** `/api/courses/:courseId/marks/upload`

**Access:** Faculty (owner), Admin

**Description:** Upload marks via Excel file

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Excel file (.xlsx, .xls) |
| assessmentType | string | Yes | One of: `internal1`, `internal2`, `assignment`, `external` |

**Expected Excel Format (2 header rows):**

| StudentID | Q1_CO1 | Q2_CO1 | Q3_CO2 | Q4_CO2 | ... |
|-----------|--------|--------|--------|--------|-----|
| | 10 | 10 | 10 | 10 | ... |
| 22CS101 | 8 | 9 | 7 | 8 | ... |
| 22CS102 | 9 | 8 | 8 | 9 | ... |

- Row 1: Column headers (Question Number_CO Number)
- Row 2: Max marks for each question
- Row 3+: Student data

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Marks uploaded successfully",
  "data": {
    "marks": {
      "_id": "6799marks1234567890ab",
      "assessmentType": "internal1",
      "totalRecords": 30,
      "totalQuestions": 10,
      "totalMaxMarks": 100,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    "summary": {
      "totalStudents": 30,
      "skippedStudents": 2,
      "cosCovered": 5,
      "cosNotCovered": 0
    },
    "warnings": [],
    "skippedStudents": [
      {
        "row": 5,
        "rollNumber": "22CS999",
        "reason": "Not enrolled in course"
      }
    ]
  }
}
```

---

### 6.2 Get All Marks Records

**GET** `/api/courses/:courseId/marks`

**Access:** Faculty (owner), Admin

**Description:** Get summary of all marks records for a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Marks records retrieved",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures"
    },
    "marks": [
      {
        "_id": "6799marks1234567890ab",
        "assessmentType": "internal1",
        "uploadedBy": {
          "_id": "6799123456789abcdef01234",
          "name": "Dr. John Smith",
          "email": "john.smith@nbac.edu"
        },
        "uploadedAt": "2024-01-15T10:30:00.000Z",
        "isProcessed": false,
        "totalMaxMarks": 100,
        "totalRecords": 30,
        "originalFileName": "internal1_marks.xlsx"
      }
    ],
    "count": 1
  }
}
```

---

### 6.3 Get Marks Template

**GET** `/api/courses/:courseId/marks/template`

**Access:** Faculty, Admin

**Description:** Download Excel template for marks upload

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response:** Excel file download (`.xlsx`)

---

### 6.4 Get Marks Summary

**GET** `/api/courses/:courseId/marks/summary`

**Access:** Faculty (owner), Admin

**Description:** Get student-wise marks summary across all assessments

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Marks summary retrieved",
  "data": {
    "studentSummary": [
      {
        "student": {
          "_id": "6799student1234567890ab",
          "name": "Student Name",
          "rollNumber": "22CS101"
        },
        "assessments": {
          "internal1": {
            "obtained": 35,
            "max": 50,
            "percentage": "70.00"
          },
          "internal2": {
            "obtained": 40,
            "max": 50,
            "percentage": "80.00"
          }
        }
      }
    ],
    "assessmentTypes": ["internal1", "internal2", "assignment", "external"]
  }
}
```

---

### 6.5 Get Specific Marks Record

**GET** `/api/courses/:courseId/marks/:marksId`

**Access:** Faculty (owner), Admin

**Description:** Get detailed marks record with student data

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |
| marksId | string | Marks record's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Marks record retrieved",
  "data": {
    "marks": {
      "_id": "6799marks1234567890ab",
      "courseId": "6799abcdef01234567890123",
      "assessmentType": "internal1",
      "uploadedBy": {
        "_id": "6799123456789abcdef01234",
        "name": "Dr. John Smith",
        "email": "john.smith@nbac.edu"
      },
      "records": [
        {
          "studentId": {
            "_id": "6799student1234567890ab",
            "name": "Student Name",
            "rollNumber": "22CS101"
          },
          "rollNumber": "22CS101",
          "questionWiseMarks": [
            {
              "questionNo": "Q1",
              "marksObtained": 8,
              "maxMarks": 10,
              "mappedCO": {
                "_id": "6799co1234567890abcdef",
                "coNumber": "CO1",
                "description": "First CO"
              }
            }
          ]
        }
      ],
      "totalMaxMarks": 100,
      "isProcessed": false
    }
  }
}
```

---

### 6.6 Delete Marks Record

**DELETE** `/api/courses/:courseId/marks/:marksId`

**Access:** Faculty (owner), Admin

**Description:** Delete a marks record

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |
| marksId | string | Marks record's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Marks record deleted successfully"
}
```

---

## 7. Feedback Routes

**Base Path:** `/api/feedback`

---

### 7.1 Submit Feedback

**POST** `/api/feedback/:courseId`

**Access:** Student only (must be enrolled)

**Description:** Submit course feedback

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| responses | array | Yes | Array of CO ratings |
| comments | string | No | Optional comments (max 500 chars) |

Each response object:

| Field | Type | Description |
|-------|------|-------------|
| coId | string | CO's MongoDB ObjectId |
| rating | number | Rating (1-5) |

**Request Example:**

```json
{
  "responses": [
    { "coId": "6799co1234567890abcdef", "rating": 4 },
    { "coId": "6799co1234567890abcdeg", "rating": 5 },
    { "coId": "6799co1234567890abcdeh", "rating": 4 }
  ],
  "comments": "Great course!"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "feedback": {
      "_id": "6799feedback1234567890a",
      "submittedAt": "2024-01-20T15:00:00.000Z",
      "totalCOs": 5
    }
  }
}
```

---

### 7.2 Get Student's Feedback Status

**GET** `/api/feedback/student/status`

**Access:** Student only

**Description:** Get feedback submission status for all enrolled courses

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Feedback status retrieved",
  "data": {
    "courses": [
      {
        "_id": "6799abcdef01234567890123",
        "courseCode": "CS301",
        "courseName": "Data Structures",
        "semester": 5,
        "academicYear": "2024-25",
        "faculty": {
          "_id": "6799123456789abcdef01234",
          "name": "Dr. John Smith",
          "email": "john.smith@nbac.edu"
        },
        "feedbackStatus": "submitted",
        "submittedAt": "2024-01-20T15:00:00.000Z"
      },
      {
        "_id": "6799abcdef01234567890124",
        "courseCode": "CS302",
        "courseName": "Database Systems",
        "semester": 5,
        "academicYear": "2024-25",
        "faculty": {
          "_id": "6799123456789abcdef01235",
          "name": "Dr. Sarah Johnson",
          "email": "sarah.johnson@nbac.edu"
        },
        "feedbackStatus": "pending",
        "submittedAt": null
      }
    ],
    "summary": {
      "total": 2,
      "submitted": 1,
      "pending": 1
    }
  }
}
```

---

### 7.3 Get Feedback Status for Course

**GET** `/api/feedback/:courseId/status`

**Access:** Student only (must be enrolled)

**Description:** Check if student has submitted feedback for a specific course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Feedback status retrieved",
  "data": {
    "courseId": "...",
    "courseCode": "CS301",
    "courseName": "Data Structures",
    "hasSubmitted": false,
    "feedback": null,
    "cos": [
      {
        "_id": "co_id_1",
        "coNumber": "CO1",
        "description": "Analyze the complexity of algorithms..."
      },
      {
        "_id": "co_id_2",
        "coNumber": "CO2",
        "description": "Design efficient data structures..."
      }
    ]
  }
}
```

---

### 7.4 Get All Feedback for Course

**GET** `/api/feedback/:courseId`

**Access:** Faculty (owner), Admin

**Description:** Get all feedback submissions for a course (paginated)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Feedback retrieved successfully",
  "data": [
    {
      "_id": "6799feedback1234567890a",
      "student": {
        "rollNumber": "22CS101"
      },
      "responses": [
        { "coNumber": "CO1", "rating": 4 },
        { "coNumber": "CO2", "rating": 5 }
      ],
      "submittedAt": "2024-01-20T15:00:00.000Z",
      "comments": "Great course!"
    }
  ],
  "meta": {
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

---

### 7.5 Get Feedback Summary

**GET** `/api/feedback/:courseId/summary`

**Access:** Faculty (owner), Admin

**Description:** Get aggregated feedback summary per CO

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Feedback summary retrieved",
  "data": {
    "course": {
      "_id": "6799abcdef01234567890123",
      "courseCode": "CS301",
      "courseName": "Data Structures"
    },
    "totalSubmissions": 28,
    "totalEnrolled": 30,
    "overallAverageRating": 4.2,
    "coWiseSummary": [
      {
        "coId": "6799co1234567890abcdef",
        "coNumber": "CO1",
        "averageRating": 4.3,
        "totalResponses": 28
      },
      {
        "coId": "6799co1234567890abcdeg",
        "coNumber": "CO2",
        "averageRating": 4.1,
        "totalResponses": 28
      }
    ],
    "responseRate": "93.3"
  }
}
```

---

## 8. Attainment Routes

**Base Path:** `/api/attainment`

---

### 8.1 Calculate Attainment

**POST** `/api/attainment/:courseId/calculate`

**Access:** Faculty (owner), Admin

**Description:** Trigger full attainment calculation for a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Attainment calculated successfully",
  "data": {
    "attainment": {
      "_id": "6799attain1234567890abc",
      "courseId": "6799abcdef01234567890123",
      "coAttainments": [
        {
          "coId": "6799co1234567890abcdef",
          "coNumber": "CO1",
          "description": "First CO",
          "successPercentage": 75.5,
          "directAttainment": 3,
          "indirectAttainment": 3,
          "finalAttainment": 3.0,
          "studentsAttained": 23,
          "totalStudents": 30,
          "averageFeedbackRating": 4.3
        }
      ],
      "poAttainments": [
        {
          "poNumber": "PO1",
          "poName": "Engineering Knowledge",
          "attainmentValue": 2.85,
          "contributingCOs": 5,
          "totalCorrelationWeight": 12
        }
      ],
      "generatedAt": "2024-01-25T10:00:00.000Z",
      "generatedBy": {
        "_id": "6799123456789abcdef01234",
        "name": "Dr. John Smith",
        "email": "john.smith@nbac.edu"
      },
      "summary": {
        "totalCOs": 5,
        "averageCOAttainment": 2.75,
        "averagePOAttainment": 2.60,
        "totalStudents": 30,
        "totalFeedbackResponses": 28
      }
    },
    "warnings": []
  }
}
```

---

### 8.2 Get Attainment Results

**GET** `/api/attainment/:courseId`

**Access:** Faculty, Admin

**Description:** Get existing attainment results for a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Attainment data retrieved",
  "data": {
    "attainment": {
      "_id": "6799attain1234567890abc",
      "courseId": "6799abcdef01234567890123",
      "coAttainments": [],
      "poAttainments": [],
      "generatedAt": "2024-01-25T10:00:00.000Z",
      "generatedBy": {},
      "warnings": [],
      "summary": {}
    }
  }
}
```

---

### 8.3 Get Department Summary

**GET** `/api/attainment/department/summary`

**Access:** Admin only

**Description:** Get PO attainment summary across all courses in department

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| department | string | Department name (optional, defaults to user's department) |
| academicYear | string | Filter by academic year (format YYYY-YY) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Department summary retrieved",
  "data": {
    "department": "Computer Science",
    "academicYear": "All years",
    "courses": [],
    "courseAttainments": [],
    "poSummary": [
      {
        "poNumber": "PO1",
        "poName": "Engineering Knowledge",
        "averageAttainment": 2.65,
        "courseCount": 10,
        "courses": [
          { "courseCode": "CS301", "value": 2.85 },
          { "courseCode": "CS302", "value": 2.45 }
        ]
      }
    ]
  }
}
```

---

### 8.4 Clear Attainment Data

**DELETE** `/api/attainment/:courseId`

**Access:** Admin only

**Description:** Clear attainment data for a course

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Attainment data cleared successfully"
}
```

---

### 8.5 Get CO Comparison Data

**GET** `/api/attainment/:courseId/co-comparison`

**Access:** Faculty (owner), Admin

**Description:** Get CO attainment data formatted for comparison charts

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "CO comparison data retrieved",
  "data": {
    "coComparison": [
      {
        "coNumber": "CO1",
        "description": "First CO",
        "directAttainment": 3,
        "indirectAttainment": 3,
        "finalAttainment": 3.0,
        "successPercentage": 75.5
      }
    ]
  }
}
```

---

### 8.6 Get PO Chart Data

**GET** `/api/attainment/:courseId/po-chart`

**Access:** Faculty (owner), Admin

**Description:** Get PO attainment data formatted for charts

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "PO chart data retrieved",
  "data": {
    "poChart": [
      {
        "poNumber": "PO1",
        "poName": "Engineering Knowledge",
        "attainmentValue": 2.85,
        "level": "High",
        "contributingCOs": 5
      }
    ]
  }
}
```

---

## 9. Report Routes

**Base Path:** `/api/reports`

---

### 9.1 Get CO Attainment Report

**GET** `/api/reports/:courseId/co`

**Access:** Faculty (owner), Admin

**Description:** Get structured CO attainment report data

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "CO attainment report generated",
  "data": {
    "report": {
      "courseInfo": {
        "courseCode": "CS301",
        "courseName": "Data Structures",
        "department": "Computer Science",
        "semester": 5,
        "academicYear": "2024-25",
        "faculty": {
          "_id": "6799123456789abcdef01234",
          "name": "Dr. John Smith",
          "email": "john.smith@nbac.edu",
          "department": "Computer Science"
        },
        "credits": 4
      },
      "coAttainmentTable": [
        {
          "coNumber": "CO1",
          "description": "First CO",
          "threshold": 60,
          "studentsAttained": 23,
          "totalStudents": 30,
          "successPercentage": 76.67,
          "directAttainment": 3,
          "indirectAttainment": 3,
          "finalAttainment": 3.0,
          "attainmentLevel": "High (3)"
        }
      ],
      "summary": {
        "totalCOs": 5,
        "averageCOAttainment": 2.75,
        "generatedAt": "2024-01-25T10:00:00.000Z"
      }
    }
  }
}
```

---

### 9.2 Get PO Attainment Report

**GET** `/api/reports/:courseId/po`

**Access:** Faculty (owner), Admin

**Description:** Get structured PO attainment report data

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "PO attainment report generated",
  "data": {
    "report": {
      "courseInfo": {},
      "poAttainmentTable": [
        {
          "poNumber": "PO1",
          "poName": "Engineering Knowledge",
          "attainmentValue": 2.85,
          "attainmentLevel": "High (3)",
          "contributingCOs": 5,
          "correlationWeight": 12
        }
      ],
      "coPOMatrix": {
        "rows": [
          {
            "coNumber": "CO1",
            "correlations": {
              "PO1": 3,
              "PO2": 3,
              "PO3": 2,
              "PO4": 1,
              "PO5": 2,
              "PO6": 0,
              "PO7": 0,
              "PO8": 0,
              "PO9": 1,
              "PO10": 1,
              "PO11": 0,
              "PO12": 2
            }
          }
        ]
      },
      "summary": {
        "averagePOAttainment": 2.60,
        "totalCOsContributing": 20
      }
    }
  }
}
```

---

### 9.3 Get Full NBA Report

**GET** `/api/reports/:courseId/full`

**Access:** Faculty (owner), Admin

**Description:** Get complete NBA report data (CO + PO + Feedback combined)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Full NBA report generated",
  "data": {
    "report": {
      "courseInfo": {},
      "coAttainment": {
        "table": [],
        "summary": {}
      },
      "coPOMatrix": [],
      "poAttainment": {
        "table": [],
        "summary": {}
      },
      "feedbackSummary": {
        "totalResponses": 28,
        "responseRate": "93.3",
        "coWiseRatings": [],
        "overallAverageRating": "4.20"
      },
      "assessments": {
        "types": [
          { "type": "internal1", "uploadedAt": "2024-01-15T10:30:00.000Z", "totalRecords": 30, "totalMaxMarks": 100 },
          { "type": "internal2", "uploadedAt": "2024-01-20T10:30:00.000Z", "totalRecords": 30, "totalMaxMarks": 100 }
        ],
        "hasAllAssessments": true
      },
      "generatedAt": "2024-01-25T10:00:00.000Z",
      "generatedBy": {},
      "warnings": []
    }
  }
}
```

---

### 9.4 Get Department Report

**GET** `/api/reports/department`

**Access:** Admin only

**Description:** Get department-level NBA summary report

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| department | string | Department name (optional) |
| academicYear | string | Filter by academic year (format YYYY-YY) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Department report generated",
  "data": {
    "report": {
      "department": "Computer Science",
      "academicYear": "All years",
      "generatedAt": "2024-01-25T10:00:00.000Z",
      "courses": [],
      "courseAttainments": [],
      "poSummary": [],
      "overallSummary": {
        "totalCourses": 15,
        "coursesWithAttainment": 12,
        "averageDepartmentPOAttainment": 2.55
      }
    }
  }
}
```

---

### 9.5 Export Report

**GET** `/api/reports/:courseId/export`

**Access:** Faculty (owner), Admin

**Description:** Export report as JSON file for frontend processing

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | string | Course's MongoDB ObjectId |

**Response:** JSON file download

```json
{
  "title": "NBA Accreditation Report - CS301",
  "generatedAt": "2024-01-25T10:00:00.000Z",
  "course": {
    "code": "CS301",
    "name": "Data Structures",
    "department": "Computer Science",
    "semester": 5,
    "academicYear": "2024-25"
  },
  "coAttainment": [],
  "poAttainment": [],
  "summary": {}
}
```

---

## HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Successful but no response body |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists or conflict |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

---

## Program Outcomes (PO) Reference

| PO | Name |
|----|------|
| PO1 | Engineering Knowledge |
| PO2 | Problem Analysis |
| PO3 | Design/Development of Solutions |
| PO4 | Conduct Investigations |
| PO5 | Modern Tool Usage |
| PO6 | The Engineer and Society |
| PO7 | Environment and Sustainability |
| PO8 | Ethics |
| PO9 | Individual and Team Work |
| PO10 | Communication |
| PO11 | Project Management and Finance |
| PO12 | Life-long Learning |

---

## NBA Attainment Scale

| Attainment Level | Value Range | Description |
|------------------|-------------|-------------|
| 3 | ≥ 70% | High Attainment |
| 2 | 60-69% | Medium Attainment |
| 1 | 50-59% | Low Attainment |
| 0 | < 50% | Very Low Attainment |

### Final CO Attainment Formula

```
Final CO Attainment = (0.75 × Direct Attainment) + (0.25 × Indirect Attainment)
```

---

## Rate Limiting

Not implemented in current version. Consider implementing rate limiting for production use.

---

## CORS Configuration

Currently configured to allow all origins in development. Restrict to specific origins in production.

---

*Last Updated: January 2024*
*Version: 1.0.0*
