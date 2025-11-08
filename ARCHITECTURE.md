# Stack Hack - System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
│                         Port: 3000                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Student    │  │   Faculty    │  │  Department  │  │   System    ││
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │  │   Admin     ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘│
│         │                 │                  │                 │        │
│  ┌──────┴─────────────────┴──────────────────┴─────────────────┴──────┐│
│  │                    Auth Context (JWT Token)                         ││
│  └──────────────────────────────┬──────────────────────────────────────┘│
│                                 │                                        │
│  ┌──────────────────────────────┴──────────────────────────────────────┐│
│  │              API Service Layer (src/services/api.js)                 ││
│  │  - authService      - courseService    - actionService              ││
│  │  - userService      - feedbackService  - notificationService        ││
│  └──────────────────────────────┬──────────────────────────────────────┘│
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                            HTTP/HTTPS (CORS)
                                  │
┌─────────────────────────────────┼────────────────────────────────────────┐
│                           BACKEND (Express)                              │
│                         Port: 5000                                       │
├─────────────────────────────────┴────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      server.js (Entry Point)                       │ │
│  │  - CORS middleware    - Body parser    - Error handler            │ │
│  └────────────┬───────────────────────────────────────┬───────────────┘ │
│               │                                        │                 │
│  ┌────────────┴──────────┐                ┌───────────┴──────────────┐  │
│  │   Middleware          │                │      Routes              │  │
│  ├───────────────────────┤                ├──────────────────────────┤  │
│  │ • auth.js             │                │ • authRoutes.js          │  │
│  │   - protect()         │◄───────────────┤ • userRoutes.js          │  │
│  │   - authorize()       │                │ • courseRoutes.js        │  │
│  │   - generateToken()   │                │ • feedbackRoutes.js      │  │
│  │                       │                │ • actionRoutes.js        │  │
│  │ • error.js            │                │                          │  │
│  │   - errorHandler()    │                └───────────┬──────────────┘  │
│  └───────────────────────┘                            │                 │
│                                            ┌───────────┴──────────────┐  │
│                                            │     Controllers          │  │
│                                            ├──────────────────────────┤  │
│                                            │ • authController.js      │  │
│                                            │   - register, login      │  │
│                                            │ • userController.js      │  │
│                                            │   - CRUD, bulk create    │  │
│                                            │ • courseController.js    │  │
│                                            │   - courses, offerings   │  │
│                                            │ • feedbackController.js  │  │
│                                            │   - forms, responses     │  │
│                                            │ • actionController.js    │  │
│                                            │   - actions, insights    │  │
│                                            └───────────┬──────────────┘  │
│                                                        │                 │
└────────────────────────────────────────────────────────┼─────────────────┘
                                                         │
                                                    Mongoose ODM
                                                         │
┌────────────────────────────────────────────────────────┼─────────────────┐
│                        DATABASE (MongoDB)              │                 │
│                      Port: 27017                       │                 │
├────────────────────────────────────────────────────────┴─────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Models (Schemas)                         │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  • User.js              - Users with roles & auth                │   │
│  │  • Course.js            - Course catalog                         │   │
│  │  • CourseOffering.js    - Semester-specific offerings            │   │
│  │  • FacultyAssignment.js - Faculty-course mappings                │   │
│  │  • FeedbackForm.js      - Questionnaires with questions          │   │
│  │  • FeedbackResponse.js  - Student submissions                    │   │
│  │  • ActionItem.js        - Improvement tasks                      │   │
│  │  • DepartmentInsight.js - Analytics & reports                    │   │
│  │  • Notification.js      - System notifications                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Collections (9)                             │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  users  │  courses  │  courseofferings  │  facultyassignments    │   │
│  │  feedbackforms  │  feedbackresponses  │  actionitems             │   │
│  │  departmentinsights  │  notifications                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ User    │                                    │ Backend │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  1. POST /api/auth/login                    │
     │     { email, password }                     │
     ├────────────────────────────────────────────►│
     │                                              │
     │                               2. Find User   │
     │                               3. Verify Pwd  │
     │                               4. Generate JWT│
     │                                              │
     │  5. { user, token }                         │
     │◄────────────────────────────────────────────┤
     │                                              │
     │  6. Store token in localStorage             │
     │                                              │
     │  7. GET /api/auth/me                        │
     │     Headers: { Authorization: Bearer token }│
     ├────────────────────────────────────────────►│
     │                                              │
     │                               8. Verify JWT  │
     │                               9. Get User    │
     │                                              │
     │  10. { user data }                          │
     │◄────────────────────────────────────────────┤
     │                                              │
```

### 2. Feedback Submission Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌──────────┐
│ Student │         │ React   │         │ Express  │         │ MongoDB  │
└────┬────┘         └────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                    │                    │
     │ 1. View Active    │                    │                    │
     │    Feedback       │                    │                    │
     ├──────────────────►│                    │                    │
     │                   │ 2. GET /feedback/  │                    │
     │                   │    active          │                    │
     │                   ├───────────────────►│                    │
     │                   │                    │ 3. Find forms for  │
     │                   │                    │    student courses │
     │                   │                    ├───────────────────►│
     │                   │                    │                    │
     │                   │                    │ 4. Forms data      │
     │                   │                    │◄───────────────────┤
     │                   │ 5. Forms list      │                    │
     │                   │◄───────────────────┤                    │
     │ 6. Display forms  │                    │                    │
     │◄──────────────────┤                    │                    │
     │                   │                    │                    │
     │ 7. Submit         │                    │                    │
     │    Feedback       │                    │                    │
     ├──────────────────►│                    │                    │
     │                   │ 8. POST /feedback/ │                    │
     │                   │    responses       │                    │
     │                   ├───────────────────►│                    │
     │                   │                    │ 9. Save response   │
     │                   │                    ├───────────────────►│
     │                   │                    │                    │
     │                   │                    │ 10. Update count   │
     │                   │                    ├───────────────────►│
     │                   │                    │                    │
     │                   │                    │ 11. Create notif   │
     │                   │                    ├───────────────────►│
     │                   │                    │                    │
     │                   │                    │ 12. Success        │
     │                   │                    │◄───────────────────┤
     │                   │ 13. Confirmation   │                    │
     │                   │◄───────────────────┤                    │
     │ 14. Success msg   │                    │                    │
     │◄──────────────────┤                    │                    │
     │                   │                    │                    │
```

### 3. Role-Based Access Control

```
┌──────────────────────────────────────────────────────────────┐
│                     Request Flow                              │
└──────────────────────────────────────────────────────────────┘

Request with JWT Token
         │
         ▼
┌─────────────────────┐
│  protect() middleware│  ← Verify token, decode user
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ authorize() middleware│  ← Check user role
└─────────┬───────────┘
          │
          ├─────► Student role ──► Can access student endpoints
          │
          ├─────► Faculty role ──► Can access faculty endpoints
          │
          ├─────► Dept Admin ───► Can access department endpoints
          │
          └─────► System Admin ─► Can access all endpoints
```

---

## API Endpoint Structure

```
/api
 ├── /auth
 │   ├── POST   /register      (Public)
 │   ├── POST   /login         (Public)
 │   ├── GET    /me            (Private - All)
 │   ├── PUT    /profile       (Private - All)
 │   └── PUT    /change-password (Private - All)
 │
 ├── /users
 │   ├── GET    /              (Private - Admin)
 │   ├── POST   /              (Private - Admin)
 │   ├── GET    /:id           (Private - All)
 │   ├── PUT    /:id           (Private - Admin)
 │   ├── DELETE /:id           (Private - System Admin)
 │   └── PUT    /:id/toggle-status (Private - System Admin)
 │
 ├── /courses
 │   ├── GET    /              (Private - All)
 │   ├── POST   /              (Private - Admin)
 │   ├── GET    /:id           (Private - All)
 │   ├── PUT    /:id           (Private - Admin)
 │   ├── DELETE /:id           (Private - System Admin)
 │   │
 │   ├── /offerings
 │   │   ├── GET    /          (Private - All)
 │   │   ├── POST   /          (Private - Admin)
 │   │   ├── GET    /:id       (Private - All)
 │   │   ├── PUT    /:id       (Private - Admin)
 │   │   └── POST   /:id/enroll (Private - Admin)
 │   │
 │   ├── /faculty/:facultyId   (Private - All)
 │   └── /assignments          (Private - Admin)
 │
 ├── /feedback
 │   ├── /forms
 │   │   ├── GET    /          (Private - All)
 │   │   ├── POST   /          (Private - Faculty/Admin)
 │   │   ├── GET    /:id       (Private - All)
 │   │   ├── PUT    /:id       (Private - Faculty/Admin)
 │   │   ├── DELETE /:id       (Private - Faculty/Admin)
 │   │   ├── GET    /:id/responses (Private - Faculty/Admin)
 │   │   └── GET    /:id/analytics (Private - Faculty/Admin)
 │   │
 │   ├── GET    /active        (Private - Student)
 │   └── POST   /responses     (Private - Student)
 │
 ├── /actions
 │   ├── GET    /              (Private - All)
 │   ├── POST   /              (Private - Faculty/Admin)
 │   ├── PUT    /:id           (Private - Owner/Admin)
 │   └── POST   /:id/evidence  (Private - Faculty)
 │
 ├── /insights
 │   ├── GET    /              (Private - Dept Admin/System Admin)
 │   └── POST   /generate      (Private - Dept Admin/System Admin)
 │
 └── /notifications
     ├── GET    /              (Private - All)
     ├── PUT    /:id/read      (Private - Owner)
     └── PUT    /read-all      (Private - Owner)
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
├─────────────────────────────────────────────────────────────┤
│  React 18.2.0        │  UI Library                          │
│  Material-UI 5.13.7  │  Component Framework                 │
│  React Router 6.14.1 │  Client-side Routing                 │
│  Chart.js 4.4.0      │  Data Visualization                  │
│  XLSX 0.18.5         │  Excel File Handling                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                │
├─────────────────────────────────────────────────────────────┤
│  Node.js             │  JavaScript Runtime                  │
│  Express 4.18.2      │  Web Framework                       │
│  Mongoose 8.0.0      │  MongoDB ODM                         │
│  bcryptjs 2.4.3      │  Password Hashing                    │
│  jsonwebtoken 9.0.2  │  JWT Authentication                  │
│  cors 2.8.5          │  Cross-Origin Requests               │
│  dotenv 16.3.1       │  Environment Variables               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     DATABASE                                │
├─────────────────────────────────────────────────────────────┤
│  MongoDB             │  NoSQL Database                      │
│  9 Collections       │  Structured Data Storage             │
│  Indexes             │  Query Optimization                  │
│  Relationships       │  Document References                 │
└─────────────────────────────────────────────────────────────┘
```

---

**Built By:** GitHub Copilot  
**Date:** November 7, 2025  
**Status:** Production-Ready Structure
