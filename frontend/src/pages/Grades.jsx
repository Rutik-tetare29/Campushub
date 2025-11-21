import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Tab, Tabs } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = user.role === 'student' 
        ? `/api/grades/student/${user.id}`
        : '/api/grades';
      
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (user.role === 'student') {
        setGrades(data.grades);
        setStatistics(data.statistics);
      } else {
        setGrades(data);
      }
    } catch (error) {
      toast.error('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (letterGrade) => {
    const colors = {
      'A+': 'success', 'A': 'success', 'A-': 'success',
      'B+': 'info', 'B': 'info', 'B-': 'info',
      'C+': 'warning', 'C': 'warning', 'C-': 'warning',
      'D': 'danger', 'F': 'danger'
    };
    return colors[letterGrade] || 'secondary';
  };

  const getGPABadgeColor = (gpa) => {
    if (gpa >= 3.5) return 'success';
    if (gpa >= 3.0) return 'info';
    if (gpa >= 2.5) return 'warning';
    return 'danger';
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">📊 Grades</h2>

      {user.role === 'student' && statistics && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Total Subjects</h6>
                <h2 className="mb-0">{statistics.totalSubjects}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Average GPA</h6>
                <h2 className="mb-0">
                  <Badge bg={getGPABadgeColor(statistics.avgGPA)}>
                    {statistics.avgGPA.toFixed(2)}
                  </Badge>
                </h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h6 className="text-muted">Grade Distribution</h6>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  {Object.entries(statistics.gradeDistribution).map(([grade, count]) => (
                    <Badge key={grade} bg={getGradeColor(grade)}>
                      {grade}: {count}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title="Overview" />
        <Tab eventKey="detailed" title="Detailed View" />
        {user.role === 'student' && <Tab eventKey="transcript" title="Transcript" />}
      </Tabs>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : grades.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h5>No grades available</h5>
            <p className="text-muted">Grades will appear here once published</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {activeTab === 'overview' && (
            <Row>
              {grades.map((grade) => (
                <Col md={6} lg={4} key={grade._id} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="mb-0">{grade.subject?.name}</h5>
                        <Badge bg={getGradeColor(grade.letterGrade)} className="fs-5">
                          {grade.letterGrade}
                        </Badge>
                      </div>
                      
                      <div className="text-center my-3">
                        <div className="display-4 mb-2">{grade.totalScore}</div>
                        <p className="text-muted mb-0">Total Score</p>
                        <Badge bg={getGPABadgeColor(grade.gpa)} className="mt-2">
                          GPA: {grade.gpa.toFixed(2)}
                        </Badge>
                      </div>
                      
                      <hr />
                      
                      <div className="small">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Assignments:</span>
                          <strong>{grade.assignments}%</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Midterm:</span>
                          <strong>{grade.midterm}%</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Final:</span>
                          <strong>{grade.final}%</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Attendance:</span>
                          <strong>{grade.attendance}%</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Participation:</span>
                          <strong>{grade.participation}%</strong>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {activeTab === 'detailed' && (
            <Card>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Semester</th>
                      <th>Assignments</th>
                      <th>Midterm</th>
                      <th>Final</th>
                      <th>Total</th>
                      <th>Grade</th>
                      <th>GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={grade._id}>
                        <td>{grade.subject?.name}</td>
                        <td>{grade.semester}</td>
                        <td>{grade.assignments}%</td>
                        <td>{grade.midterm}%</td>
                        <td>{grade.final}%</td>
                        <td><strong>{grade.totalScore}</strong></td>
                        <td>
                          <Badge bg={getGradeColor(grade.letterGrade)}>
                            {grade.letterGrade}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getGPABadgeColor(grade.gpa)}>
                            {grade.gpa.toFixed(2)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default Grades;
