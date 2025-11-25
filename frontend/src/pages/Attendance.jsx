import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [sessionForm, setSessionForm] = useState({
    subject: '',
    subjectName: '',
    schedule: '',
    expiryMinutes: 10
  });
  const user = JSON.parse(localStorage.getItem('user'));
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchAttendance();
    if (isTeacher) {
      fetchSubjects();
    }
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const endpoint = isTeacher 
        ? '/attendance'
        : `/attendance/student/${user.id}`;
      
      const { data } = await API.get(endpoint);
      
      if (isTeacher) {
        setAttendanceRecords(data);
      } else {
        setAttendanceRecords(data.attendance);
        setStatistics(data.statistics);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      const { data } = await API.get('/subjects');
      console.log('Subjects fetched:', data);
      setSubjects(data);
      if (data.length === 0) {
        toast.info('No subjects found. Please create subjects first.');
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load subjects');
    }
  };

  const createQRSession = async () => {
    console.log('=== CREATE QR SESSION CALLED ===');
    console.log('Session form:', sessionForm);
    
    // Validate form
    if (!sessionForm.subject) {
      console.log('Validation failed: No subject selected');
      toast.error('Please select a subject');
      return;
    }

    try {
      console.log('Creating session with:', {
        subject: sessionForm.subject,
        subjectName: sessionForm.subjectName,
        expiryMinutes: sessionForm.expiryMinutes
      });

      // Create a unique schedule ID if not provided
      const scheduleId = sessionForm.schedule || `temp-schedule-${Date.now()}`;
      
      const payload = {
        schedule: scheduleId,
        subject: sessionForm.subject,
        date: new Date().toISOString(),
        expiryMinutes: sessionForm.expiryMinutes
      };

      console.log('Sending payload:', payload);
      
      const { data } = await API.post('/attendance/session/create', payload);
      
      console.log('Session created successfully:', data);
      
      // Store subject name for display
      data.subjectName = sessionForm.subjectName;
      
      setActiveSession(data);
      setShowCreateSessionModal(false);
      setShowQRModal(true);
      toast.success(`QR session created! Valid for ${sessionForm.expiryMinutes} minutes`);
      
      // Reset form
      setSessionForm({
        subject: '',
        subjectName: '',
        schedule: '',
        expiryMinutes: 10
      });
    } catch (error) {
      console.error('=== CREATE SESSION ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.errors?.map(e => e.msg).join(', ')
        || 'Failed to create session';
      toast.error(errorMsg);
    }
  };

  const startScanner = () => {
    setShowScanModal(true);
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          formatsToSupport: ['QR_CODE'],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        false
      );
      
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);
    }, 100);
  };

  const onScanSuccess = async (decodedText) => {
    try {
      // Stop the scanner immediately after successful scan
      if (scanner) {
        scanner.clear();
      }
      
      console.log('QR Scanned:', decodedText);
      
      // Try to parse the QR data
      let parsedData;
      try {
        // The QR data from backend is base64 encoded, need to decode
        const decoded = atob(decodedText);
        parsedData = JSON.parse(decoded);
        console.log('Parsed QR data:', parsedData);
      } catch (e) {
        console.error('QR decode error:', e);
        toast.error('Invalid QR code format. Please scan the attendance QR code shown by your teacher.');
        setShowScanModal(false);
        return;
      }

      // Check if this is a student ID QR (not for attendance)
      if (parsedData.type === 'student_id') {
        toast.error('This is a Student ID QR code. Please scan the Attendance Session QR code provided by your teacher.');
        setShowScanModal(false);
        return;
      }

      // Check if this is an attendance QR
      if (parsedData.type !== 'attendance') {
        toast.error('This is not an attendance QR code.');
        setShowScanModal(false);
        return;
      }
      
      // Get user location
      const location = await getCurrentLocation();
      
      // Send the original encoded QR data to backend
      const { data } = await API.post('/attendance/mark', {
        qrData: decodedText,
        location
      });
      
      toast.success('Attendance marked successfully! ✅');
      setShowScanModal(false);
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
      setShowScanModal(false);
      if (scanner) {
        scanner.clear();
      }
    }
  };

  const onScanFailure = (error) => {
    // Only log actual scanning errors, not routine scanning attempts
    if (error && !error.includes('NotFoundException')) {
      console.warn('QR Scan Error:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
          resolve(null);
        }
      );
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: <Badge bg="success">Present</Badge>,
      absent: <Badge bg="danger">Absent</Badge>,
      late: <Badge bg="warning">Late</Badge>,
      excused: <Badge bg="info">Excused</Badge>
    };
    return badges[status] || <Badge bg="secondary">{status}</Badge>;
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Attendance</h2>
        <div className="d-flex gap-2">
          {isTeacher ? (
            <>
              <Link to="/attendance/student-qr">
                <Button variant="info">
                  <i className="bi bi-qr-code me-2"></i>
                  Manage Student QR
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setShowCreateSessionModal(true)}>
                <i className="bi bi-qr-code-scan me-2"></i>
                Generate QR Session
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={startScanner}>
              <i className="bi bi-upc-scan me-2"></i>
              Scan QR Code
            </Button>
          )}
        </div>
      </div>

      {!isTeacher && statistics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Total Classes</h6>
                <h2>{statistics.total}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Present</h6>
                <h2 className="text-success">{statistics.present}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Absent</h6>
                <h2 className="text-danger">{statistics.absent}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Attendance Rate</h6>
                <h2 className={`text-${getPercentageColor(statistics.percentage)}`}>
                  {statistics.percentage}%
                </h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Attendance Records</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No attendance records found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    {isTeacher && <th>Student</th>}
                    <th>Status</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.subject?.name}</td>
                      {isTeacher && <td>{record.student?.name}</td>}
                      <td>{getStatusBadge(record.status)}</td>
                      <td>
                        <Badge bg="secondary">
                          {record.method === 'qr' ? 'QR Code' : 'Manual'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Session Modal */}
      <Modal show={showCreateSessionModal} onHide={() => setShowCreateSessionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Attendance Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Subject <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={sessionForm.subject}
                onChange={(e) => {
                  const selectedSubject = subjects.find(s => s._id === e.target.value);
                  setSessionForm({
                    ...sessionForm, 
                    subject: e.target.value,
                    subjectName: selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : ''
                  });
                }}
                required
              >
                <option value="">-- Select a subject --</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </Form.Select>
              {subjects.length === 0 && (
                <Form.Text className="text-warning">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  No subjects available. Please create a subject first.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Session Duration (minutes)</Form.Label>
              <Form.Select
                value={sessionForm.expiryMinutes}
                onChange={(e) => setSessionForm({...sessionForm, expiryMinutes: parseInt(e.target.value)})}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </Form.Select>
            </Form.Group>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Students will scan the generated QR code to mark their attendance for this session.
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateSessionModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createQRSession}>
            <i className="bi bi-qr-code-scan me-2"></i>
            Generate QR Code
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Display Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Attendance QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {activeSession && (
            <>
              <div className="mb-3 p-4 bg-white rounded">
                {activeSession.qrCode ? (
                  <img 
                    src={activeSession.qrCode} 
                    alt="Attendance QR Code" 
                    style={{ width: '300px', height: '300px' }}
                  />
                ) : (
                  <QRCode value={activeSession.qrData || 'No data'} size={300} />
                )}
              </div>
              <div className="alert alert-success">
                <h5 className="alert-heading">
                  <i className="bi bi-check-circle me-2"></i>
                  QR Code Active
                </h5>
                <p className="mb-0">
                  Students can scan this QR code to mark their attendance
                </p>
              </div>
              <div className="d-flex justify-content-around text-start">
                <div>
                  <strong>Subject:</strong>
                  <p className="mb-0">{activeSession.subjectName || activeSession.subject?.name || 'N/A'}</p>
                </div>
                <div>
                  <strong>Valid For:</strong>
                  <p className="mb-0 text-danger">
                    <i className="bi bi-clock me-1"></i>
                    {sessionForm.expiryMinutes || 10} minutes
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  <i className="bi bi-lightbulb me-1"></i>
                  Tip: Display this QR code on a projector or screen for students to scan
                </small>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Scanner Modal */}
      <Modal show={showScanModal} onHide={() => {
        setShowScanModal(false);
        scanner?.clear();
      }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Scan Attendance QR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info mb-3">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Important:</strong> Scan the <strong>Attendance Session QR code</strong> shown by your teacher, 
            NOT your personal Student ID QR code.
          </div>
          <div id="qr-reader" style={{ width: '100%' }}></div>
          <p className="text-muted text-center mt-3 small">
            Position the QR code within the frame to scan
          </p>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Attendance;
