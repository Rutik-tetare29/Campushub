import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs } from 'react-bootstrap';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const COLORS = ['#667eea', '#764ba2', '#f6ad55', '#48bb78', '#4299e1', '#f56565'];

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [gradeData, setGradeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [overviewRes, attendanceRes, gradeRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        user.role !== 'student' ? axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        }) : Promise.resolve({ data: null }),
        user.role !== 'student' ? axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/grades`, {
          headers: { Authorization: `Bearer ${token}` }
        }) : Promise.resolve({ data: null })
      ]);

      setOverview(overviewRes.data);
      setAttendanceData(attendanceRes.data);
      setGradeData(gradeRes.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!overview) return null;

    const cards = user.role === 'admin' ? [
      { title: 'Total Students', value: overview.totalStudents, icon: '👨‍🎓', color: 'primary' },
      { title: 'Total Teachers', value: overview.totalTeachers, icon: '👨‍🏫', color: 'info' },
      { title: 'Total Subjects', value: overview.totalSubjects, icon: '📚', color: 'success' },
      { title: 'Total Assignments', value: overview.totalAssignments, icon: '📝', color: 'warning' }
    ] : user.role === 'teacher' ? [
      { title: 'My Subjects', value: overview.mySubjects, icon: '📚', color: 'primary' },
      { title: 'Total Assignments', value: overview.totalAssignments, icon: '📝', color: 'info' },
      { title: 'Pending Submissions', value: overview.pendingSubmissions, icon: '⏳', color: 'warning' },
      { title: 'Total Students', value: overview.studentsCount, icon: '👨‍🎓', color: 'success' }
    ] : [
      { title: 'Enrolled Subjects', value: overview.enrolledSubjects, icon: '📚', color: 'primary' },
      { title: 'Pending Assignments', value: overview.pendingAssignments, icon: '📝', color: 'warning' },
      { title: 'Average Grade', value: overview.avgGrade?.toFixed(2) || 'N/A', icon: '🎯', color: 'info' },
      { title: 'Attendance Rate', value: `${overview.attendanceRate}%`, icon: '✅', color: 'success' }
    ];

    return (
      <Row className="mb-4">
        {cards.map((card, index) => (
          <Col md={6} lg={3} key={index} className="mb-3">
            <Card className={`text-white bg-${card.color} shadow-sm`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white-50 mb-2">{card.title}</h6>
                    <h2 className="mb-0">{card.value}</h2>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.5 }}>
                    {card.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderAttendanceCharts = () => {
    if (!attendanceData) return null;

    const statusData = attendanceData.statusDistribution?.map(item => ({
      name: item._id,
      value: item.count
    })) || [];

    const trendData = attendanceData.dailyTrend?.map(item => ({
      date: item._id,
      present: item.present,
      total: item.total,
      rate: ((item.present / item.total) * 100).toFixed(1)
    })) || [];

    return (
      <>
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header>
                <h6 className="mb-0">Attendance Status Distribution</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header>
                <h6 className="mb-0">Daily Attendance Trend</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#48bb78" name="Present" />
                    <Line type="monotone" dataKey="total" stroke="#667eea" name="Total" />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {attendanceData.lowAttendanceStudents?.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h6 className="mb-0">⚠️ Students with Low Attendance</h6>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.lowAttendanceStudents.map((student, index) => (
                          <tr key={index}>
                            <td>{student.student?.name}</td>
                            <td>{student.student?.email}</td>
                            <td>
                              <span className="badge bg-danger">
                                {student.attendanceRate?.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </>
    );
  };

  const renderGradeCharts = () => {
    if (!gradeData) return null;

    const distributionData = gradeData.gradeDistribution?.map(item => ({
      grade: item._id,
      count: item.count
    })) || [];

    const avgScoresData = gradeData.avgScores ? [
      { component: 'Assignments', score: gradeData.avgScores.avgAssignments?.toFixed(1) || 0 },
      { component: 'Midterm', score: gradeData.avgScores.avgMidterm?.toFixed(1) || 0 },
      { component: 'Final', score: gradeData.avgScores.avgFinal?.toFixed(1) || 0 },
      { component: 'Total', score: gradeData.avgScores.avgTotal?.toFixed(1) || 0 }
    ] : [];

    return (
      <>
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header>
                <h6 className="mb-0">Grade Distribution</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#667eea" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header>
                <h6 className="mb-0">Average Scores by Component</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgScoresData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="component" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#48bb78" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {gradeData.topPerformers?.length > 0 && (
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h6 className="mb-0">🏆 Top Performers</h6>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student</th>
                          <th>Email</th>
                          <th>GPA</th>
                          <th>Grade</th>
                          <th>Total Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradeData.topPerformers.map((student, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{student.student}</td>
                            <td>{student.email}</td>
                            <td>
                              <span className="badge bg-success">
                                {student.gpa?.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                {student.letterGrade}
                              </span>
                            </td>
                            <td>{student.totalScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </>
    );
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">📈 Analytics Dashboard</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {renderOverviewCards()}

          {user.role !== 'student' && (
            <Tabs defaultActiveKey="attendance" className="mb-4">
              <Tab eventKey="attendance" title="Attendance Analytics">
                {renderAttendanceCharts()}
              </Tab>
              <Tab eventKey="grades" title="Grade Analytics">
                {renderGradeCharts()}
              </Tab>
            </Tabs>
          )}
        </>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;
