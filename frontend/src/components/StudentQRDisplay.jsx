import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import API from '../api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const StudentQRDisplay = ({ studentId }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQRCode();
  }, [studentId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/attendance/student-qr/${studentId}`);
      setQrData(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('QR code not generated yet. Please contact your administrator.');
      } else {
        setError('Failed to load QR code');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrData?.qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `${qrData.student.name.replace(/\s+/g, '_')}_StudentID_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  };

  const printQR = () => {
    if (!qrData?.qrCode) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID QR Code - ${qrData.student.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #333;
              padding: 30px;
              border-radius: 10px;
            }
            h1 { margin-bottom: 10px; font-size: 24px; }
            .info { margin: 15px 0; color: #666; }
            img { max-width: 300px; border: 1px solid #ddd; padding: 10px; }
            .footer { margin-top: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Student ID QR Code</h1>
            <div class="info">
              <strong>Name:</strong> ${qrData.student.name}<br>
              <strong>Roll Number:</strong> ${qrData.student.rollNumber}<br>
              <strong>Department:</strong> ${qrData.student.department}
            </div>
            <img src="${qrData.qrCode}" alt="Student QR Code">
            <div class="footer">
              Generated: ${format(new Date(qrData.generatedAt), 'PP')}<br>
              Valid Until: ${format(new Date(qrData.expiresAt), 'PP')}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <Card className="text-center py-5">
        <Card.Body>
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading QR code...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-qr-code me-2"></i>
          My Student ID QR Code
        </h5>
      </Card.Header>
      <Card.Body className="text-center">
        {qrData && (
          <>
            <div className="mb-3">
              <h5>{qrData.student.name}</h5>
              <p className="text-muted mb-2">
                <strong>Roll Number:</strong> {qrData.student.rollNumber}<br />
                <strong>Department:</strong> {qrData.student.department}
              </p>
            </div>

            <div className="mb-3">
              <img
                src={qrData.qrCode}
                alt="Student QR Code"
                className="img-fluid"
                style={{
                  maxWidth: '280px',
                  border: '3px solid #0d6efd',
                  padding: '15px',
                  borderRadius: '10px',
                  backgroundColor: '#fff'
                }}
              />
            </div>

            {qrData.isExpired ? (
              <Alert variant="danger">
                <i className="bi bi-exclamation-circle me-2"></i>
                <strong>QR Code Expired</strong>
                <br />
                <small>This QR code has expired. Please contact your administrator for a new one.</small>
              </Alert>
            ) : (
              <>
                <div className="mb-3">
                  <Badge bg="success" className="me-2">
                    <i className="bi bi-check-circle me-1"></i>
                    Active
                  </Badge>
                  <Badge bg="info">
                    Valid until {format(new Date(qrData.expiresAt), 'MMM dd, yyyy')}
                  </Badge>
                </div>

                <Alert variant="info">
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    Use this QR code for attendance and identification purposes.
                    Keep it secure and do not share with others.
                  </small>
                </Alert>
              </>
            )}

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <Button
                variant="primary"
                onClick={downloadQR}
                disabled={qrData.isExpired}
              >
                <i className="bi bi-download me-2"></i>
                Download
              </Button>
              <Button
                variant="outline-primary"
                onClick={printQR}
                disabled={qrData.isExpired}
              >
                <i className="bi bi-printer me-2"></i>
                Print
              </Button>
              <Button
                variant="outline-secondary"
                onClick={fetchQRCode}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </div>

            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Generated on {format(new Date(qrData.generatedAt), 'PPpp')}
              </small>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default StudentQRDisplay;
