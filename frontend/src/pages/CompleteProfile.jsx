import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';

const CompleteProfile = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    department: '',
    rollNumber: '',
    semester: ''
  });
  const [loading, setLoading] = useState(false);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Biotechnology'
  ];

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.department || !formData.rollNumber || !formData.semester) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/users/complete-profile', formData);
      
      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update App.jsx user state
      setUser(updatedUser);
      
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center">
        <Card style={{ maxWidth: '600px', width: '100%' }}>
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <h2 className="mb-2">Complete Your Profile</h2>
              <p className="text-muted">
                Please provide the following information to access the system
              </p>
            </div>

            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              This information is required to show you relevant subjects and schedules.
            </Alert>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Department <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Roll Number <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="Enter your roll number"
                  required
                />
                <Form.Text className="text-muted">
                  Your unique student roll number
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  Semester <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default CompleteProfile;
