# Stack Hack - Academic Feedback System and Continuous Improvement System

A comprehensive academic feedback management system with role-based access for Students, Faculty, Department Admins, and System Admins.

## 🔐 Sample Login Credentials

### System Admin
- **Email:** admin@vignan.ac.in
- **Password:** admin@123

## 🚀 Features

### Student Features
- Submit feedback for courses
- View active feedback forms
- Track submission history
- View personal analytics

### Faculty Features
- Create and manage feedback forms
- View feedback responses and analytics
- Manage action items
- Track course performance

### Department Admin Features
- View department-wide insights
- Manage faculty and courses
- Generate performance reports
- Assign action items

### System Admin Features
- User management (CRUD operations)
- Bulk user creation via Excel
- System-wide analytics
- Course and department management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation & Setup

### 1. Clone the Repository


### 2. Backend Setup

```powershell
# From repo root
cd backend

# Install dependencies
npm install

# Create backend .env (see "Environment Variables" below)
# Seed database (WARNING: this clears existing data)
npm run seed

# Start backend (nodemon)
npm run dev
```

Backend runs at http://localhost:5000

3) Frontend setup

```powershell
# Navigate to root folder

# Install frontend dependencies (if not already installed)
npm install
npm start
```

The frontend will run on `http://localhost:3000`

## 🔐 Sample Login Credentials

After running the seed script, use these credentials:

### System Admin
- **Email:** admin@vignan.ac.in
- **Password:** admin@123

## 📁 Project Structure

```
Stack Hack/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth & error middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── utils/          # Utilities (seed data)
│   ├── .env            # Environment variables
│   ├── package.json
│   └── server.js       # Entry point
│
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # React context (Auth)
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── App.js
│   └── index.js
│
├── .env                # Frontend env variables
├── package.json
└── README.md
```

## 🗄️ Database Collections

1. **Users** - Student, Faculty, Department Admin, System Admin
2. **Courses** - Course catalog
3. **CourseOfferings** - Semester-specific course instances
4. **FacultyAssignments** - Faculty-course mappings
5. **FeedbackForms** - Feedback questionnaires
6. **FeedbackResponses** - Student responses
7. **ActionItems** - Improvement tasks
8. **DepartmentInsights** - Analytics and reports
9. **Notifications** - System notifications

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create user/bulk users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Admin only)
- `GET /api/courses/offerings` - Get course offerings
- `POST /api/courses/assignments` - Assign faculty

### Feedback
- `GET /api/feedback/forms` - Get feedback forms
- `POST /api/feedback/forms` - Create feedback form (Faculty)
- `GET /api/feedback/active` - Get active forms (Student)
- `POST /api/feedback/responses` - Submit response (Student)
- `GET /api/feedback/forms/:id/analytics` - Get analytics (Faculty)

### Actions & Insights
- `GET /api/actions` - Get action items
- `POST /api/actions` - Create action item
- `GET /api/insights` - Get department insights
- `POST /api/insights/generate` - Generate insights

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🧪 Testing the Application

1. **Start MongoDB**
   ```powershell
   # Make sure MongoDB service is running
   mongod
   ```

2. **Seed Database**
   ```powershell
   cd backend
   npm run seed
   ```

3. **Start Backend**
   ```powershell
   npm run dev
   ```

4. **Start Frontend**
   ```powershell
   # In a new terminal
   npm start
   ```

5. **Login and Test**
   - Navigate to http://localhost:3000
   - Use sample credentials
   - Test different role functionalities

## 🔄 Workflow Examples

### Student Workflow
1. Login with student credentials
2. View active feedback forms
3. Submit feedback for courses
4. View submission history

### Faculty Workflow
1. Login with faculty credentials
2. Create new feedback form
3. Select target sections
4. View responses and analytics
5. Create action items based on feedback

### Department Admin Workflow
1. Login with department admin credentials
2. View all courses in department
3. Generate department insights
4. Review faculty performance
5. Assign improvement tasks

### System Admin Workflow
1. Login with admin credentials
2. Manage users (Create, Update, Delete)
3. Bulk user creation via Excel
4. View system-wide analytics
5. Manage courses and departments

## 🔧 Environment Variables

### Backend (.env in backend folder)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stack_hack_db
JWT_SECRET=change_me_in_production
JWT_EXPIRE=7d
NODE_ENV=development

# CORS: comma-separated allowed origins
CLIENT_URL=http://localhost:3000

# System Admin credentials enforced at server startup
SYSTEM_ADMIN_EMAIL=admin@vignan.ac.in
SYSTEM_ADMIN_PASSWORD=admin@123
```

Create a `.env` in repo root (frontend):

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 Notes

- All passwords are hashed using bcryptjs
- JWT tokens expire after 7 days
- Anonymous feedback hides student identity from faculty
- Department insights contain confidential data
- Action items can be assigned and tracked

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in backend/.env

### API Not Responding
- Verify backend server is running on port 5000
- Check CORS configuration

### Login Fails
- Ensure database is seeded
- Check email/password credentials
- Verify JWT_SECRET is set

## 📞 Support

For issues or questions, check the console logs in:
- Browser DevTools (Frontend errors)
- Terminal running backend (API errors)
- MongoDB logs (Database errors)

## 🎯 Next Steps

- Set up email service for notifications
- Implement file upload for evidence
- Add real-time updates with WebSockets
- Deploy to production server
- Add unit and integration tests

---

## Team Members:
**Akhil,**
**Gowtham,**
**Neerush,**
**Dhanush**

### VFSTR University, Vadlamudi.

## Contact - 231fa04094@vignan.ac.in for any queries & support.
