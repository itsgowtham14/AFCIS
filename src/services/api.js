const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic API call handler
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============ AUTH SERVICES ============
export const authService = {
  login: async (email, password) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }
    
    return data;
  },

  register: async (userData) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getMe: async () => {
    return await apiCall('/auth/me');
  },

  updateProfile: async (profileData) => {
    return await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return await apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
};

// ============ USER SERVICES ============
export const userService = {
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/users?${queryString}`);
  },

  getUserById: async (id) => {
    return await apiCall(`/users/${id}`);
  },

  createUser: async (userData) => {
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Bulk creation - role specific
  bulkCreateStudents: async (studentsArray) => {
    return await apiCall('/users/bulk-students', {
      method: 'POST',
      body: JSON.stringify(studentsArray)
    });
  },

  bulkCreateFaculty: async (facultyArray) => {
    return await apiCall('/users/bulk-faculty', {
      method: 'POST',
      body: JSON.stringify(facultyArray)
    });
  },

  bulkCreateDeptAdmin: async (deptAdminArray) => {
    return await apiCall('/users/bulk-deptadmin', {
      method: 'POST',
      body: JSON.stringify(deptAdminArray)
    });
  },

  getFacultyCourseInfo: async (facultyId) => {
    return await apiCall(`/users/${facultyId}/courses`);
  },

  updateUser: async (id, userData) => {
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: async (id) => {
    return await apiCall(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  toggleUserStatus: async (id) => {
    return await apiCall(`/users/${id}/toggle-status`, {
      method: 'PUT'
    });
  }
};

// ============ COURSE SERVICES ============
export const courseService = {
  getCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/courses?${queryString}`);
  },

  getCourseById: async (id) => {
    return await apiCall(`/courses/${id}`);
  },

  createCourse: async (courseData) => {
    return await apiCall('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  },

  updateCourse: async (id, courseData) => {
    return await apiCall(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  },

  deleteCourse: async (id) => {
    return await apiCall(`/courses/${id}`, {
      method: 'DELETE'
    });
  },

  getCourseOfferings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/courses/offerings?${queryString}`);
  },

  getCourseOfferingById: async (id) => {
    return await apiCall(`/courses/offerings/${id}`);
  },

  createCourseOffering: async (offeringData) => {
    return await apiCall('/courses/offerings', {
      method: 'POST',
      body: JSON.stringify(offeringData)
    });
  },

  updateCourseOffering: async (id, offeringData) => {
    return await apiCall(`/courses/offerings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(offeringData)
    });
  },

  enrollStudent: async (offeringId, studentId, sectionName) => {
    return await apiCall(`/courses/offerings/${offeringId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId, sectionName })
    });
  },

  getFacultyCourses: async (facultyId) => {
    return await apiCall(`/courses/faculty/${facultyId}`);
  },

  assignFaculty: async (assignmentData) => {
    return await apiCall('/courses/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  }
};

// ============ FEEDBACK SERVICES ============
export const feedbackService = {
  // Feedback Forms
  getFeedbackForms: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/feedback/forms?${queryString}`);
  },

  getFeedbackFormById: async (id) => {
    return await apiCall(`/feedback/forms/${id}`);
  },

  createFeedbackForm: async (formData) => {
    return await apiCall('/feedback/forms', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  },

  updateFeedbackForm: async (id, formData) => {
    return await apiCall(`/feedback/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData)
    });
  },

  deleteFeedbackForm: async (id) => {
    return await apiCall(`/feedback/forms/${id}`, {
      method: 'DELETE'
    });
  },

  // Student specific
  getActiveFeedback: async () => {
    return await apiCall('/feedback/active');
  },

  submitFeedbackResponse: async (responseData) => {
    return await apiCall('/feedback/responses', {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
  },

  getMyFeedbackHistory: async () => {
    return await apiCall('/feedback/my-history');
  },

  // Faculty/Admin
  getFeedbackResponses: async (formId) => {
    return await apiCall(`/feedback/forms/${formId}/responses`);
  },

  getFeedbackAnalytics: async (formId) => {
    return await apiCall(`/feedback/forms/${formId}/analytics`);
  },

  // Department Admin Analytics
  getDepartmentAnalytics: async () => {
    // Fetch analytics for logged-in admin's department
    return await apiCall('/feedback/department/analytics');
  },

  getCourseAnalytics: async (courseId) => {
    // Get analytics for a specific course (with department check on backend)
    return await apiCall(`/feedback/department/analytics/course/${courseId}`);
  },

  getFacultyFormAnalytics: async (facultyId, formId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/feedback/faculty/${facultyId}/forms/${formId}/analytics${queryString ? `?${queryString}` : ''}`;
    return await apiCall(endpoint);
  },

  getFacultyPerformanceTrends: async (facultyId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/feedback/faculty/${facultyId}/trends${queryString ? `?${queryString}` : ''}`;
    return await apiCall(endpoint);
  },

  getFacultyAnalytics: async (facultyId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/feedback/department/faculty/${facultyId}/analytics${queryString ? `?${queryString}` : ''}`;
    return await apiCall(endpoint);
  },
};

// ============ ACTION ITEM SERVICES ============
export const actionService = {
  getActionItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/actions?${queryString}`);
  },

  createActionItem: async (actionData) => {
    return await apiCall('/actions', {
      method: 'POST',
      body: JSON.stringify(actionData)
    });
  },

  updateActionItem: async (id, actionData) => {
    return await apiCall(`/actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(actionData)
    });
  },

  addEvidence: async (id, evidenceData) => {
    return await apiCall(`/actions/${id}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidenceData)
    });
  }
};

// ============ INSIGHT SERVICES ============
export const insightService = {
  getDepartmentInsights: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiCall(`/insights?${queryString}`);
  },

  generateInsights: async (department, semester) => {
    return await apiCall('/insights/generate', {
      method: 'POST',
      body: JSON.stringify({ department, semester })
    });
  }
};

// ============ NOTIFICATION SERVICES ============
export const notificationService = {
  getNotifications: async () => {
    return await apiCall('/notifications');
  },

  markAsRead: async (id) => {
    return await apiCall(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  markAllAsRead: async () => {
    return await apiCall('/notifications/read-all', {
      method: 'PUT'
    });
  }
};

// ============ DEPARTMENT SERVICES ============
export const departmentService = {
  getAllFaculty: async (department) => {
    const queryString = department ? `?department=${department}` : '';
    return await apiCall(`/department/faculty${queryString}`);
  },

  getFacultyPerformance: async (facultyId, department) => {
    const queryString = department ? `?department=${department}` : '';
    return await apiCall(`/department/faculty/${facultyId}/performance${queryString}`);
  },

  getSectionForms: async (facultyId, offeringId, sectionName) => {
    return await apiCall(`/department/faculty/${facultyId}/sections/${offeringId}/${sectionName}/forms`);
  },

  getFormResponsesVisualization: async (formId) => {
    return await apiCall(`/department/forms/${formId}/responses`);
  },

  getOverallAnalytics: async (department) => {
    return await apiCall(`/department/analytics/overall?department=${department}`);
  },

  getFacultyAnalytics: async (facultyId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/feedback/department/faculty/${facultyId}/analytics${queryString ? `?${queryString}` : ''}`;
    return await apiCall(endpoint);
  },

  getCourseAnalytics: async (courseId) => {
    return await apiCall(`/department/analytics/course/${courseId}`);
  },

  getSectionAnalytics: async (offeringId, sectionName) => {
    return await apiCall(`/department/analytics/section/${offeringId}/${sectionName}`);
  }
};

export default {
  auth: authService,
  users: userService,
  courses: courseService,
  feedback: feedbackService,
  actions: actionService,
  insights: insightService,
  notifications: notificationService,
  department: departmentService
};
