// Mock data for prototype
export const users = {
  students: [
    { id: 's1', name: 'Alice Johnson', email: 'alice@uni.edu' },
    { id: 's2', name: 'Ben Carter', email: 'ben@uni.edu' },
    { id: 's3', name: 'Chloe Li', email: 'chloe@uni.edu' },
    { id: 's4', name: 'Diego Ruiz', email: 'diego@uni.edu' },
    { id: 's5', name: 'Emma Stone', email: 'emma@uni.edu' }
  ],
  faculty: [
    { id: 'f1', name: 'Dr. Smith', email: 'smith@uni.edu' },
    { id: 'f2', name: 'Prof. Lee', email: 'lee@uni.edu' },
    { id: 'f3', name: 'Dr. Patel', email: 'patel@uni.edu' }
  ],
  admins: [
    { id: 'a1', name: 'System Admin', email: 'admin@uni.edu' }
  ]
};

export const courses = [
  { id: 'c1', name: 'Data Structures', code: 'CS201' },
  { id: 'c2', name: 'Algorithms', code: 'CS202' }
];

// Section enrollment data (total students per section per course)
export const sectionEnrollments = {
  'c1-A': 50, // Data Structures Section A has 50 students
  'c1-B': 45, // Data Structures Section B has 45 students
  'c1-C': 40, // Data Structures Section C has 40 students
  'c2-A': 48  // Algorithms Section A has 48 students
};

export const feedbackForms = [
  {
    id: 'fdb1',
    courseId: 'c1',
    facultyId: 'f1',
    section: 'A',
    title: 'Lecture feedback - Week 1 (Sec A)',
    type: 'Lecture',
    dueDate: '2025-12-01',
    questions: [
      'Teaching Clarity',
      'Pace',
      'Engagement',
      'Materials'
    ],
    responses: [
      {
        submittedBy: 'alice@uni.edu',
        studentId: 's1',
        section: 'A',
        ratings: { 'Teaching Clarity': 5, Pace: 4, Engagement: 5, Materials: 4 },
        comment: 'Great examples',
        date: '2025-10-01T10:00:00Z'
      },
      {
        submittedBy: 'ben@uni.edu',
        studentId: 's2',
        section: 'A',
        ratings: { 'Teaching Clarity': 4, Pace: 3, Engagement: 4, Materials: 3 },
        comment: 'Could slow down a bit',
        date: '2025-10-02T11:00:00Z'
      }
    ]
  },
  {
    id: 'fdb1b',
    courseId: 'c1',
    facultyId: 'f1',
    section: 'B',
    title: 'Lecture feedback - Week 1 (Sec B)',
    type: 'Lecture',
    dueDate: '2025-12-01',
    questions: [
      'Teaching Clarity',
      'Pace',
      'Engagement',
      'Materials'
    ],
    responses: [
      {
        submittedBy: 'chloe@uni.edu',
        studentId: 's3',
        section: 'B',
        ratings: { 'Teaching Clarity': 3, Pace: 4, Engagement: 3, Materials: 4 },
        comment: 'Good pace for Section B',
        date: '2025-10-01T10:30:00Z'
      },
      {
        submittedBy: 'diego@uni.edu',
        studentId: 's4',
        section: 'B',
        ratings: { 'Teaching Clarity': 4, Pace: 4, Engagement: 4, Materials: 3 },
        comment: 'Clear explanations',
        date: '2025-10-01T11:00:00Z'
      }
    ]
  },
  {
    id: 'fdb2',
    courseId: 'c2',
    facultyId: 'f2',
    section: 'A',
    title: 'Module feedback - Sorting (Sec A)',
    type: 'Module',
    dueDate: '2025-12-15',
    questions: [
      'Teaching Clarity',
      'Pace',
      'Engagement',
      'Materials'
    ],
    responses: [
      {
        submittedBy: 'chloe@uni.edu',
        studentId: 's3',
        section: 'A',
        ratings: { 'Teaching Clarity': 3, Pace: 3, Engagement: 3, Materials: 2 },
        comment: 'Materials missing references',
        date: '2025-10-03T09:30:00Z'
      }
    ]
  },
  {
    id: 'fdb3',
    courseId: 'c1',
    facultyId: 'f1',
    section: 'C',
    title: 'Unit feedback - Arrays (Sec C)',
    type: 'Unit',
    dueDate: '2025-12-10',
    questions: [
      'Teaching Clarity',
      'Pace',
      'Engagement',
      'Materials'
    ],
    responses: [
      {
        submittedBy: 'emma@uni.edu',
        studentId: 's5',
        section: 'C',
        ratings: { 'Teaching Clarity': 5, Pace: 5, Engagement: 5, Materials: 5 },
        comment: 'Excellent teaching',
        date: '2025-10-05T14:00:00Z'
      }
    ]
  }
];

export const analytics = {
  studentStats: {
    totalFeedback: 15,
    impactScore: 87
  },
  facultyStats: [
    { course: 'Data Structures', responseRate: 68, avgRating: 4.2 },
    { course: 'Algorithms', responseRate: 45, avgRating: 3.8 }
  ],
  departmentMetrics: {
    avgSatisfaction: 4.1,
    responseRate: 62,
    actionCompletion: 78
  }
};
