const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/error');

// Load env vars
dotenv.config();

// Start server after DB connection and initial setup
const ensureAdmin = require('./utils/ensureAdmin');

const startServer = async () => {
  // Connect to database
  await connectDB();

  // Ensure default system admin exists / updated
  await ensureAdmin();

  // Start Express server
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - support comma-separated list in CLIENT_URL
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(u => u.trim());
app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser requests (e.g., curl, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);
    if (clientUrls.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
// IMPORTANT: Mount more specific routes BEFORE general routes to avoid conflicts
app.use('/api/feedback/department', require('./routes/departmentRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api', require('./routes/actionRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Stack Hack API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

module.exports = app;
