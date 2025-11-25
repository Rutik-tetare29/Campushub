import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import API from '../api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const StudentQRGeneration = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expiryDays, setExpiryDays] = useState(365);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, with-qr, without-qr
  const [selectedQR, setSelectedQR] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/users/students');
      setStudents(data);
    } catch (error) {
      toast.error('Failed to fetch students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (studentId) => {
    try {
      setGenerating(true);
      const { data } = await API.post('/attendance/student-qr/generate', {
        studentId,
        expiryDays
      });
      toast.success('QR code generated successfully!');
      fetchStudents(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('Please select at least one student');
      return;
    }

    try {
      setGenerating(true);
      const { data } = await API.post('/attendance/student-qr/bulk-generate', {
        studentIds: selectedStudents,
        expiryDays
      });
      
      const successCount = data.results.filter(r => r.status === 'success').length;
      const failCount = data.results.filter(r => r.status === 'failed').length;
      
      if (failCount > 0) {
        toast.warning(`Generated ${successCount} QR codes. ${failCount} failed.`);
      } else {
        toast.success(`Successfully generated ${successCount} QR codes!`);
      }
      
      setSelectedStudents([]);
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate QR codes');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewQR = async (studentId) => {
    try {
      const { data } = await API.get(`/attendance/student-qr/${studentId}`);
      setSelectedQR(data);
      setShowQRModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch QR code');
      console.error(error);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const downloadQR = (qrCode, studentName) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${studentName.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'with-qr') {
      return matchesSearch && student.qrCode;
    } else if (filter === 'without-qr') {
      return matchesSearch && !student.qrCode;
    }
    return matchesSearch;
  });

  const isQRExpired = (expiryDate) => {
    return expiryDate && new Date() > new Date(expiryDate);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-qr-code me-2"></i>
          Student QR Generation
        </h2>
        {isTeacherOrAdmin && selectedStudents.length > 0 && (
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            disabled={generating}
          >
            <i className="bi bi-qr-code-scan me-2"></i>
            Generate QR for Selected ({selectedStudents.length})
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search Students</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filter</Form.Label>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Students</option>
                  <option value="with-qr">With QR Code</option>
                  <option value="without-qr">Without QR Code</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>QR Expiry (Days)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Students Table */}
      <Card>
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Students ({filteredStudents.length})
          </h5>
          {isTeacherOrAdmin && (
            <Form.Check
              type="checkbox"
              label="Select All"
              checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
              onChange={handleSelectAll}
              className="text-white"
            />
          )}
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Alert variant="info">No students found</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  {isTeacherOrAdmin && <th width="50">Select</th>}
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>QR Status</th>
                  <th>Generated At</th>
                  <th>Expires At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const expired = isQRExpired(student.qrExpiresAt);
                  return (
                    <tr key={student._id}>
                      {isTeacherOrAdmin && (
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                          />
                        </td>
                      )}
                      <td>{student.rollNumber || 'N/A'}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {student.avatar && (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                          )}
                          {student.name}
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>{student.department || 'N/A'}</td>
                      <td>
                        {student.qrCode ? (
                          expired ? (
                            <Badge bg="danger">Expired</Badge>
                          ) : (
                            <Badge bg="success">Active</Badge>
                          )
                        ) : (
                          <Badge bg="secondary">Not Generated</Badge>
                        )}
                      </td>
                      <td>
                        {student.qrGeneratedAt
                          ? format(new Date(student.qrGeneratedAt), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                      <td>
                        {student.qrExpiresAt
                          ? format(new Date(student.qrExpiresAt), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {student.qrCode ? (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewQR(student._id)}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              {(expired || isTeacherOrAdmin) && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleGenerateQR(student._id)}
                                  disabled={generating}
                                >
                                  <i className="bi bi-arrow-repeat"></i>
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleGenerateQR(student._id)}
                              disabled={generating}
                            >
                              <i className="bi bi-qr-code me-1"></i>
                              Generate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Bulk Generation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate QR Codes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            You are about to generate QR codes for <strong>{selectedStudents.length}</strong> student(s).
            Students will receive notifications once their QR codes are ready.
          </Alert>
          <Form.Group>
            <Form.Label>QR Code Validity (Days)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="365"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
            />
            <Form.Text className="text-muted">
              QR codes will expire after this many days
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={generating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBulkGenerate} disabled={generating}>
            {generating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <i className="bi bi-qr-code-scan me-2"></i>
                Generate QR Codes
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View QR Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Student QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedQR && (
            <>
              <h5>{selectedQR.student.name}</h5>
              <p className="text-muted mb-3">
                Roll Number: {selectedQR.student.rollNumber}<br />
                Department: {selectedQR.student.department}
              </p>
              
              <div className="mb-3">
                <img
                  src={selectedQR.qrCode}
                  alt="Student QR Code"
                  className="img-fluid"
                  style={{ maxWidth: '300px', border: '2px solid #ddd', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              {selectedQR.isExpired && (
                <Alert variant="danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  This QR code has expired
                </Alert>
              )}

              <div className="mb-3">
                <small className="text-muted">
                  Generated: {format(new Date(selectedQR.generatedAt), 'PPpp')}<br />
                  Expires: {format(new Date(selectedQR.expiresAt), 'PPpp')}
                </small>
              </div>

              <Button
                variant="primary"
                onClick={() => downloadQR(selectedQR.qrCode, selectedQR.student.name)}
              >
                <i className="bi bi-download me-2"></i>
                Download QR Code
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StudentQRGeneration;
