# API Documentation - Stack Hack

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Access:** Public

**Request Body:**
```json
{
  "universityId": "STU005",
  "email": "student@example.edu",
  "password": "password123",
  "role": "student",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890"
  },
  "academicInfo": {
    "department": "Computer Science",
    "program": "B.Tech",
    "semester": 5,
    "section": "A",
    "rollNumber": "CS21005"
  }
}
```

**Response:**
```json
{
  "_id": "...",
  "universityId": "STU005",
  "email": "student@example.edu",
  "role": "student",
  "personalInfo": {...},
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/login
Login user.

**Access:** Public

**Request Body:**
```json
{
  "email": "student@example.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "...",
  "universityId": "STU005",
  "email": "student@example.edu",
  "role": "student",
  "personalInfo": {...},
  "academicInfo": {...},
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /auth/me
Get current logged-in user.

**Access:** Private

**Response:**
```json
{
  "_id": "...",
  "universityId": "STU005",
  "email": "student@example.edu",
  "role": "student",
  "personalInfo": {...},
  "academicInfo": {...}
}
```

### PUT /auth/profile
Update user profile.

**Access:** Private

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "9876543210"
  },
  "preferences": {
    "notifications": true,
    "emailUpdates": false
  }
}
```

### PUT /auth/change-password
Change password.

**Access:** Private

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## User Management Endpoints

### GET /users
Get all users with filtering and pagination.

**Access:** Private (Admin/Department Admin)

**Query Parameters:**
- `role` - Filter by role (student, faculty, department_admin, system_admin)
- `department` - Filter by department
- `search` - Search by name, email, or university ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:** `/users?role=student&department=Computer Science&page=1&limit=20`

**Response:**
```json
{
  "users": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 100
}
```

### POST /users
Create single user or bulk users.

**Access:** Private (Admin/Department Admin)

**Single User Request:**
```json
{
  "universityId": "FAC003",
  "email": "faculty@example.edu",
  "password": "password123",
  "role": "faculty",
  "personalInfo": {...},
  "academicInfo": {
    "facultyDepartment": "Computer Science",
    "designation": "Assistant Professor"
  }
}
```

**Bulk Users Request:**
```json
[
  {
    "universityId": "STU006",
    "email": "student1@example.edu",
    "password": "password123",
    "role": "student",
    "personalInfo": {...},
    "academicInfo": {...}
  },
  {
    "universityId": "STU007",
    "email": "student2@example.edu",
    "password": "password123",
    "role": "student",
    "personalInfo": {...},
    "academicInfo": {...}
  }
]
```

**Bulk Response:**
```json
{
  "success": [...],
  "errors": [...],
  "message": "Created 2 users, 0 errors"
}
```

### GET /users/:id
Get user by ID.

**Access:** Private

### PUT /users/:id
Update user.

**Access:** Private (Admin/Department Admin)

### DELETE /users/:id
Delete user.

**Access:** Private (System Admin only)

### PUT /users/:id/toggle-status
Toggle user active status.

**Access:** Private (System Admin only)

---

## Course Endpoints

### GET /courses
Get all courses.

**Access:** Private

**Query Parameters:**
- `department` - Filter by department
- `isActive` - Filter active courses (true/false)
- `search` - Search by course code or name

### POST /courses
Create course.

**Access:** Private (Admin/Department Admin)

**Request Body:**
```json
{
  "courseCode": "CS303",
  "courseName": "Web Development",
  "department": "Computer Science",
  "credits": 3,
  "description": "Modern web development",
  "learningOutcomes": [
    "Build responsive websites",
    "Understand RESTful APIs"
  ]
}
```

### GET /courses/offerings
Get all course offerings.

**Query Parameters:**
- `semester` - e.g., "Fall 2024"
- `academicYear` - e.g., "2024-2025"
- `status` - active, completed, upcoming

### POST /courses/offerings
Create course offering.

**Request Body:**
```json
{
  "courseId": "...",
  "semester": "Fall 2024",
  "academicYear": "2024-2025",
  "sections": [
    {
      "sectionName": "A",
      "schedule": {
        "days": ["MON", "WED"],
        "time": "10:00-11:30",
        "room": "Room 301"
      },
      "enrolledStudents": []
    }
  ],
  "status": "active",
  "startDate": "2024-09-01",
  "endDate": "2024-12-15"
}
```

### POST /courses/offerings/:id/enroll
Enroll student in section.

**Request Body:**
```json
{
  "studentId": "...",
  "sectionName": "A"
}
```

### GET /courses/faculty/:facultyId
Get courses assigned to faculty.

### POST /courses/assignments
Assign faculty to course.

**Request Body:**
```json
{
  "facultyId": "...",
  "courseOfferingId": "...",
  "sections": ["A", "B"],
  "role": "primary",
  "teachingLoad": 6,
  "status": "active"
}
```

---

## Feedback Endpoints

### GET /feedback/forms
Get feedback forms.

**Access:** Private

**Query Parameters:**
- `status` - draft, active, closed, archived
- `courseOfferingId` - Filter by course
- `type` - lecture, unit, module, semester

### POST /feedback/forms
Create feedback form.

**Access:** Private (Faculty/Admin)

**Request Body:**
```json
{
  "title": "Week 10 Lecture Feedback",
  "type": "lecture",
  "courseOfferingId": "...",
  "targetSections": ["A", "B"],
  "questions": [
    {
      "questionText": "How clear was the lecture?",
      "type": "rating",
      "required": true
    },
    {
      "questionText": "Additional comments",
      "type": "text",
      "required": false
    }
  ],
  "settings": {
    "isAnonymous": true,
    "allowComments": true,
    "showToFaculty": false,
    "autoClose": true,
    "closeDate": "2024-12-01"
  },
  "schedule": {
    "openDate": "2024-11-20",
    "closeDate": "2024-12-01"
  },
  "status": "active"
}
```

### GET /feedback/forms/:id
Get feedback form by ID.

### PUT /feedback/forms/:id
Update feedback form.

### DELETE /feedback/forms/:id
Delete feedback form.

### GET /feedback/active
Get active feedback forms for student.

**Access:** Private (Student)

**Response:**
```json
[
  {
    "_id": "...",
    "title": "Week 10 Lecture Feedback",
    "type": "lecture",
    "submitted": false,
    "courseOfferingId": {...},
    "facultyId": {...},
    ...
  }
]
```

### POST /feedback/responses
Submit feedback response.

**Access:** Private (Student)

**Request Body:**
```json
{
  "formId": "...",
  "responses": [
    {
      "questionId": "...",
      "rating": 5
    },
    {
      "questionId": "...",
      "textResponse": "Great lecture!"
    }
  ],
  "timeSpent": 120
}
```

### GET /feedback/forms/:id/responses
Get responses for a feedback form.

**Access:** Private (Faculty/Department Admin/Admin)

### GET /feedback/forms/:id/analytics
Get analytics for a feedback form.

**Access:** Private (Faculty/Department Admin/Admin)

**Response:**
```json
{
  "totalResponses": 45,
  "responseRate": 75,
  "questionAnalytics": [
    {
      "questionId": "...",
      "questionText": "How clear was the lecture?",
      "type": "rating",
      "average": 4.2,
      "distribution": {
        "1": 2,
        "2": 3,
        "3": 8,
        "4": 15,
        "5": 17
      },
      "totalResponses": 45
    }
  ]
}
```

---

## Action Items & Insights

### GET /actions
Get action items.

**Access:** Private

**Query Parameters:**
- `status` - pending, in_progress, completed, cancelled
- `priority` - low, medium, high, critical
- `assignedTo` - Filter by assigned user

### POST /actions
Create action item.

**Access:** Private (Faculty/Department Admin/Admin)

**Request Body:**
```json
{
  "title": "Improve lecture materials",
  "description": "Update slides with more examples",
  "type": "content",
  "priority": "high",
  "assignedTo": "...",
  "courseOfferingId": "...",
  "dueDate": "2024-12-15",
  "visibility": {
    "faculty": true,
    "students": false,
    "department": true
  }
}
```

### PUT /actions/:id
Update action item.

### POST /actions/:id/evidence
Add evidence to action item.

**Request Body:**
```json
{
  "description": "Updated slides",
  "fileUrl": "https://..."
}
```

### GET /insights
Get department insights.

**Access:** Private (Department Admin/Admin)

**Query Parameters:**
- `department` - Filter by department
- `semester` - Filter by semester

### POST /insights/generate
Generate department insights.

**Access:** Private (Department Admin/Admin)

**Request Body:**
```json
{
  "department": "Computer Science",
  "semester": "Fall 2024"
}
```

---

## Notifications

### GET /notifications
Get notifications for current user.

**Access:** Private

### PUT /notifications/:id/read
Mark notification as read.

**Access:** Private

### PUT /notifications/read-all
Mark all notifications as read.

**Access:** Private

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Role-Based Access

### Student
- Can view and submit feedback
- Can view their own data
- Cannot create feedback forms

### Faculty
- Can create and manage feedback forms
- Can view responses for their courses
- Can create action items
- Cannot access other faculty's data

### Department Admin
- Can manage users in their department
- Can view all feedback in department
- Can generate insights
- Can assign action items

### System Admin
- Full access to all endpoints
- Can manage all users
- Can view all data
- Can delete records
