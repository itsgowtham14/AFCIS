import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error as ErrorIcon,
  Delete,
  School,
  Person,
  Business,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BulkUserCreation() {
  const [currentTab, setCurrentTab] = useState(0);
  const [uploadedData, setUploadedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [creationResults, setCreationResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setUploadedData([]);
    setValidationResults([]);
    setCreationResults(null);
    setShowResults(false);
  };

  const downloadStudentTemplate = () => {
    const template = [
      {
        name: 'Alice Johnson',
        regId: 'CS21001',
        email: 'alice@student.edu',
        section: '1A',
        department: 'Computer Science',
        mobileNumber: '9876543210',
      },
      {
        name: 'Bob Williams',
        regId: 'CS21002',
        email: 'bob@student.edu',
        section: '1B',
        department: 'Computer Science',
        mobileNumber: '9876543211',
      },
    ];
    createExcelFile(template, 'Students_Template.xlsx', 'Students');
  };

  const downloadFacultyTemplate = () => {
    const template = [
      {
        name: 'Dr. John Smith',
        facultyId: 'FAC001',
        designation: 'Professor',
        courseName: 'Data Structures',
        section: '1A,1B',
        department: 'Computer Science',
        email: 'john.smith@university.edu',
        mobileNumber: '9876543220',
      },
    ];
    createExcelFile(template, 'Faculty_Template.xlsx', 'Faculty');
  };

  const downloadDeptAdminTemplate = () => {
    const template = [
      {
        name: 'Michael Davis',
        email: 'michael.davis@university.edu',
        department: 'Computer Science',
        mobileNumber: '9876543230',
      },
    ];
    createExcelFile(template, 'DeptAdmin_Template.xlsx', 'DeptAdmins');
  };

  const createExcelFile = (data, filename, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const maxWidth = data.reduce((w, r) => Math.max(w, ...Object.values(r).map(val => String(val).length)), 10);
    ws['!cols'] = Object.keys(data[0]).map(() => ({ wch: maxWidth + 2 }));
    XLSX.writeFile(wb, filename);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      setUploadedData(json);
      validateData(json);
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const validateData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];

      if (currentTab === 0) {
        if (!row.name) errors.push('Name required');
        if (!row.regId) errors.push('Reg ID required');
        if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Valid email required');
        if (!row.section || !/^[1-4][A-D]$/i.test(row.section)) errors.push('Section format: 1A-4D');
        if (!row.department) errors.push('Department required');
        if (!row.mobileNumber || !/^\d{10}$/.test(String(row.mobileNumber))) errors.push('10-digit mobile required');
      } else if (currentTab === 1) {
        if (!row.name) errors.push('Name required');
        if (!row.facultyId) errors.push('Faculty ID required');
        if (!row.designation) errors.push('Designation required');
        if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Valid email required');
        if (!row.mobileNumber || !/^\d{10}$/.test(String(row.mobileNumber))) errors.push('10-digit mobile required');
      } else if (currentTab === 2) {
        if (!row.name) errors.push('Name required');
        if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Valid email required');
        if (!row.department) errors.push('Department required');
        if (!row.mobileNumber || !/^\d{10}$/.test(String(row.mobileNumber))) errors.push('10-digit mobile required');
      }

      return {
        index: index + 1,
        data: row,
        status: errors.length > 0 ? 'error' : 'valid',
        errors,
      };
    });

    setValidationResults(results);
  };

  const handleCreateUsers = async () => {
    setProcessing(true);
    const validData = validationResults.filter(r => r.status === 'valid').map(r => r.data);

    try {
      let response;
      if (currentTab === 0) {
        response = await api.users.bulkCreateStudents(validData);
      } else if (currentTab === 1) {
        response = await api.users.bulkCreateFaculty(validData);
      } else if (currentTab === 2) {
        response = await api.users.bulkCreateDeptAdmin(validData);
      }

      setCreationResults(response);
      setShowResults(true);
    } catch (error) {
      alert('Error creating users: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveRow = (index) => {
    const newData = uploadedData.filter((_, i) => i !== index);
    setUploadedData(newData);
    validateData(newData);
  };

  const validCount = validationResults.filter(r => r.status === 'valid').length;
  const errorCount = validationResults.filter(r => r.status === 'error').length;

  const tabConfig = [
    { label: 'Students', icon: <School />, color: '#667eea', downloadFn: downloadStudentTemplate },
    { label: 'Faculty', icon: <Person />, color: '#764ba2', downloadFn: downloadFacultyTemplate },
    { label: 'Dept Admins', icon: <Business />, color: '#f093fb', downloadFn: downloadDeptAdminTemplate },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
          📊 Bulk User Creation
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Upload separate Excel files for Students, Faculty, and Department Admins
        </Typography>
      </Box>

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
          {tabConfig.map((tab, index) => (
            <Tab key={index} icon={tab.icon} label={tab.label} />
          ))}
        </Tabs>
      </Card>

      {tabConfig.map((tab, index) => (
        <TabPanel key={index} value={currentTab} index={index}>
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Download sx={{ fontSize: 60, color: tab.color, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                Step 1: Download {tab.label} Template
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Download />}
                onClick={tab.downloadFn}
                sx={{
                  background: `linear-gradient(135deg, ${tab.color} 0%, #764ba2 100%)`,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <CloudUpload sx={{ fontSize: 60, color: tab.color, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                Step 2: Upload Filled Excel
              </Typography>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id={`file-upload-${index}`}
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor={`file-upload-${index}`}>
                <Button
                  variant="contained"
                  component="span"
                  size="large"
                  startIcon={<CloudUpload />}
                  sx={{
                    background: `linear-gradient(135deg, ${tab.color} 0%, #764ba2 100%)`,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Select File
                </Button>
              </label>
            </CardContent>
          </Card>

          {validationResults.length > 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{validCount}</Typography>
                          <Typography variant="body2">Valid Records</Typography>
                        </Box>
                        <CheckCircle sx={{ fontSize: 40, opacity: 0.5 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{errorCount}</Typography>
                          <Typography variant="body2">Errors</Typography>
                        </Box>
                        <ErrorIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Validation Results
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>ID/Email</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Issues</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validationResults.map((result) => (
                          <TableRow key={result.index}>
                            <TableCell>{result.index}</TableCell>
                            <TableCell>{result.data.name}</TableCell>
                            <TableCell>
                              {result.data.regId || result.data.facultyId || result.data.email}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={result.status}
                                size="small"
                                color={result.status === 'valid' ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              {result.errors.length > 0 && (
                                <Typography variant="caption" color="error" display="block">
                                  {result.errors.join(', ')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveRow(result.index - 1)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Button
                      variant="contained"
                      disabled={errorCount > 0 || validCount === 0 || processing}
                      onClick={handleCreateUsers}
                      sx={{
                        background: `linear-gradient(135deg, ${tab.color} 0%, #764ba2 100%)`,
                        px: 4,
                        py: 1.5,
                      }}
                    >
                      {processing ? 'Creating...' : `Create ${validCount} ${tab.label}`}
                    </Button>
                  </Box>
                  {processing && <LinearProgress sx={{ mt: 2 }} />}
                </CardContent>
              </Card>
            </>
          )}
        </TabPanel>
      ))}

      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
            Creation Complete
          </Box>
        </DialogTitle>
        <DialogContent>
          {creationResults && (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                Successfully created {creationResults.successCount} users
                {creationResults.errorCount > 0 && `, ${creationResults.errorCount} errors`}
              </Alert>

              {creationResults.success && creationResults.success.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>Created Users:</Typography>
                  <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Login ID</TableCell>
                          <TableCell>Password</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {creationResults.success.map((user, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <code style={{ backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                {user.regId || user.facultyId || user.email}
                              </code>
                            </TableCell>
                            <TableCell>
                              <code style={{ backgroundColor: '#ffe6e6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#d63031' }}>
                                {user.password}
                              </code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {creationResults.errors && creationResults.errors.length > 0 && (
                <>
                  <Typography variant="h6" color="error" sx={{ mb: 2 }}>Errors:</Typography>
                  {creationResults.errors.map((err, idx) => (
                    <Alert key={idx} severity="error" sx={{ mb: 1 }}>
                      {err.regId || err.facultyId || err.email}: {err.error}
                    </Alert>
                  ))}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowResults(false);
            setUploadedData([]);
            setValidationResults([]);
            setCreationResults(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
