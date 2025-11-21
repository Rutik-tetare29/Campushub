import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [scanner, setScanner] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchAttendance();
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = isTeacher 
        ? '/api/attendance'
        : `/api/attendance/student/${user.id}`;
      
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  const createQRSession = async (scheduleId, subjectId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/attendance/session/create`,
        {
          schedule: scheduleId,
          subject: subjectId,
          date: new Date().toISOString(),
          expiryMinutes: 10
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveSession(data);
      setShowQRModal(true);
      toast.success('QR session created! Valid for 10 minutes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create session');
    }
  };

  const startScanner = () => {
    setShowScanModal(true);
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );
      
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);
    }, 100);
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const token = localStorage.getItem('token');
      
      // Get user location
      const location = await getCurrentLocation();
      
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/attendance/mark`,
        {
          sessionId: activeSession._id,
          qrData: decodedText,
          location
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Attendance marked successfully! ✅');
      setShowScanModal(false);
      scanner?.clear();
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const onScanFailure = (error) => {
    // Ignore scanning errors
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
        {isTeacher ? (
          <Button variant="primary" onClick={() => createQRSession('schedule-id', 'subject-id')}>
            <i className="bi bi-qr-code me-2"></i>
            Generate QR Code
          </Button>
        ) : (
          <Button variant="primary" onClick={startScanner}>
            <i className="bi bi-upc-scan me-2"></i>
            Scan QR Code
          </Button>
        )}
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

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Attendance QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {activeSession && (
            <>
              <div className="mb-3">
                <QRCode value={activeSession.qrData} size={300} />
              </div>
              <p className="text-muted">
                Students can scan this QR code to mark their attendance
              </p>
              <p className="text-danger small">
                <i className="bi bi-clock me-2"></i>
                Expires in 10 minutes
              </p>
              <p className="small">
                <strong>Subject:</strong> {activeSession.subject?.name}
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Scanner Modal */}
      <Modal show={showScanModal} onHide={() => {
        setShowScanModal(false);
        scanner?.clear();
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scan Attendance QR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
