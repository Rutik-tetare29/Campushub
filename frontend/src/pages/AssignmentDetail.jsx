import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, Alert } from 'react-bootstrap';
import API from '../api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchAssignmentDetails();
    if (isTeacher) {
      fetchSubmissions();
    }
  }, [id]);

  const fetchAssignmentDetails = async () => {
    try {
      const { data } = await API.get(`/assignments/${id}`);
      setAssignment(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch assignment details');
      console.error(error);
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data } = await API.get(`/assignments/${id}/submissions`);
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/assignments/${id}/grade/${selectedSubmission._id}`, gradeData);
      toast.success('Submission graded successfully!');
      setShowGradeModal(false);
      setGradeData({ grade: '', feedback: '' });
      fetchSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to grade submission');
      console.error(error);
    }
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/assignments/${id}`, editingAssignment);
      toast.success('Assignment updated successfully!');
      setShowEditModal(false);
      setEditingAssignment(null);
      fetchAssignmentDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update assignment');
      console.error(error);
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      await API.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully!');
      navigate('/assignments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
      console.error(error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await API.put(`/assignments/${id}`, { status: newStatus });
      toast.success(`Assignment ${newStatus === 'published' ? 'published' : newStatus === 'closed' ? 'closed' : 'saved as draft'} successfully!`);
      fetchAssignmentDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      console.error(error);
    }
  };

  const handleReopenAssignment = async (e) => {
    e.preventDefault();
    
    // Validate that the new due date is in the future
    const selectedDate = new Date(newDueDate);
    const now = new Date();
    
    if (selectedDate <= now) {
      toast.error('Due date must be in the future!');
      return;
    }
    
    // Validate that a new date was selected (different from old date)
    const oldDate = new Date(assignment.dueDate);
    if (selectedDate.getTime() === oldDate.getTime()) {
      toast.error('Please select a new due date!');
      return;
    }
    
    try {
      await API.put(`/assignments/${id}`, { 
        status: 'published',
        dueDate: newDueDate 
      });
      toast.success('Assignment reopened successfully with new due date!');
      setShowReopenModal(false);
      setNewDueDate('');
      fetchAssignmentDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen assignment');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { bg: 'info', text: 'Submitted' },
      graded: { bg: 'success', text: 'Graded' },
      returned: { bg: 'warning', text: 'Returned' },
      late: { bg: 'danger', text: 'Late' }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Assignment not found</Alert>
        <Button onClick={() => navigate('/assignments')}>Back to Assignments</Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/assignments')}>
        ← Back to Assignments
      </Button>

      {/* Assignment Details */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2>{assignment.title}</h2>
              <p className="text-muted mb-2">
                <i className="bi bi-book me-2"></i>
                {assignment.subject?.name} ({assignment.subject?.code})
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Badge bg={assignment.status === 'published' ? 'success' : assignment.status === 'closed' ? 'danger' : 'secondary'}>
                {assignment.status}
              </Badge>
              
              {/* Teacher Action Buttons */}
              {isTeacher && (
                <>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setEditingAssignment({
                        ...assignment,
                        subject: assignment.subject._id,
                        dueDate: format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm")
                      });
                      setShowEditModal(true);
                    }}
                    title="Edit Assignment"
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </Button>
                  
                  {assignment.status === 'draft' && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleStatusChange('published')}
                      title="Publish Assignment"
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Publish
                    </Button>
                  )}
                  
                  {assignment.status === 'published' && (
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleStatusChange('closed')}
                      title="Close Assignment"
                    >
                      <i className="bi bi-unlock me-1"></i>
                      Close
                    </Button>
                  )}
                  
                  {assignment.status === 'closed' && (
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => {
                        setNewDueDate(''); // Start with empty to force new selection
                        setShowReopenModal(true);
                      }}
                      title="Reopen Assignment"
                    >
                      <i className="bi bi-lock me-1"></i>
                      Reopen
                    </Button>
                  )}
                  
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    title="Delete Assignment"
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          <Row className="mb-3">
            <Col md={4}>
              <strong>Due Date:</strong>
              <br />
              {format(new Date(assignment.dueDate), 'PPP p')}
            </Col>
            <Col md={4}>
              <strong>Max Score:</strong>
              <br />
              {assignment.maxScore} points
            </Col>
            <Col md={4}>
              <strong>Created By:</strong>
              <br />
              {assignment.createdBy?.name}
            </Col>
          </Row>

          <hr />

          <div className="mb-3">
            <strong>Description:</strong>
            <p className="mt-2">{assignment.description}</p>
          </div>

          {assignment.instructions && (
            <div className="mb-3">
              <strong>Instructions:</strong>
              <p className="mt-2">{assignment.instructions}</p>
            </div>
          )}

          <Row>
            <Col md={6}>
              <strong>Late Submission:</strong>{' '}
              {assignment.allowLateSubmission ? (
                <span className="text-success">Allowed ({assignment.lateSubmissionPenalty}% penalty)</span>
              ) : (
                <span className="text-danger">Not Allowed</span>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Submissions Section (Teacher View) */}
      {isTeacher && (
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-file-earmark-text me-2"></i>
              Submissions ({submissions.length})
            </h5>
          </Card.Header>
          <Card.Body>
            {submissions.length === 0 ? (
              <Alert variant="info">No submissions yet</Alert>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Submitted At</th>
                    <th>Status</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub._id}>
                      <td>{sub.student?.name}</td>
                      <td>{sub.student?.email}</td>
                      <td>{format(new Date(sub.submittedAt), 'PPp')}</td>
                      <td>{getStatusBadge(sub.status)}</td>
                      <td>
                        {sub.grade !== null && sub.grade !== undefined ? (
                          <strong>{sub.grade}/{assignment.maxScore}</strong>
                        ) : (
                          <span className="text-muted">Not graded</span>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setGradeData({
                              grade: sub.grade || '',
                              feedback: sub.feedback || ''
                            });
                            setShowGradeModal(true);
                          }}
                        >
                          {sub.grade !== null ? 'Update Grade' : 'Grade'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Student View - Show their submission */}
      {!isTeacher && assignment.submission && (
        <Card className="shadow-sm">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-file-earmark-check me-2"></i>
              Your Submission
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Status:</strong>
                <div className="mt-1">{getStatusBadge(assignment.submission.status)}</div>
              </Col>
              <Col md={6}>
                <strong>Submitted At:</strong>
                <div className="mt-1">{format(new Date(assignment.submission.submittedAt), 'PPp')}</div>
              </Col>
            </Row>

            {(assignment.submission.grade !== null && assignment.submission.grade !== undefined) && (
              <Alert variant="success" className="mb-3">
                <Row>
                  <Col md={6}>
                    <strong>Your Grade:</strong>
                    <div className="mt-1">
                      <Badge bg="success" className="fs-5">
                        {assignment.submission.grade}/{assignment.maxScore}
                      </Badge>
                      <span className="ms-2 text-muted">
                        ({((assignment.submission.grade / assignment.maxScore) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <strong>Graded By:</strong>
                    <div className="mt-1">{assignment.submission.gradedBy?.name || 'Teacher'}</div>
                  </Col>
                </Row>
              </Alert>
            )}

            {assignment.submission.feedback && (
              <Card className="mb-3 border-primary">
                <Card.Header className="bg-primary text-white">
                  <strong>
                    <i className="bi bi-chat-left-text me-2"></i>
                    Teacher's Feedback
                  </strong>
                </Card.Header>
                <Card.Body>
                  <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {assignment.submission.feedback}
                  </p>
                </Card.Body>
              </Card>
            )}

            <Card className="mb-3">
              <Card.Header>
                <strong>
                  <i className="bi bi-file-text me-2"></i>
                  Your Submission Content
                </strong>
              </Card.Header>
              <Card.Body>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {assignment.submission.textContent || 'No text content'}
                </p>
              </Card.Body>
            </Card>

            {assignment.submission.attachments && assignment.submission.attachments.length > 0 && (
              <Card>
                <Card.Header>
                  <strong>
                    <i className="bi bi-paperclip me-2"></i>
                    Attachments ({assignment.submission.attachments.length})
                  </strong>
                </Card.Header>
                <Card.Body>
                  {assignment.submission.attachments.map((file, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <i className="bi bi-file-earmark me-2"></i>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        {file.filename}
                      </a>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Student View - Not Submitted */}
      {!isTeacher && !assignment.submission && (
        <Alert variant="warning">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            You haven't submitted this assignment yet
          </Alert.Heading>
          <p>Please submit your work before the due date.</p>
          <hr />
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Due Date:</strong> {format(new Date(assignment.dueDate), 'PPP p')}
            </div>
            <Button variant="primary" onClick={() => navigate('/assignments')}>
              Go to Submit
            </Button>
          </div>
        </Alert>
      )}

      {/* Grade Submission Modal */}
      <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Grade Submission</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGradeSubmission}>
          <Modal.Body>
            {/* Student Info */}
            <Card className="mb-3 bg-light">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <strong>Student:</strong> {selectedSubmission?.student?.name}
                  </Col>
                  <Col md={6}>
                    <strong>Email:</strong> {selectedSubmission?.student?.email}
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}>
                    <strong>Submitted At:</strong>{' '}
                    {selectedSubmission?.submittedAt && format(new Date(selectedSubmission.submittedAt), 'PPp')}
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong> {selectedSubmission && getStatusBadge(selectedSubmission.status)}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Submission Content */}
            <Card className="mb-3">
              <Card.Header className="bg-primary text-white">
                <strong>Submission Content</strong>
              </Card.Header>
              <Card.Body>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedSubmission?.textContent ? (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedSubmission.textContent}</p>
                  ) : (
                    <p className="text-muted">No text content submitted</p>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Attachments */}
            {selectedSubmission?.attachments && selectedSubmission.attachments.length > 0 && (
              <Card className="mb-3">
                <Card.Header className="bg-info text-white">
                  <strong>Attachments ({selectedSubmission.attachments.length})</strong>
                </Card.Header>
                <Card.Body>
                  {selectedSubmission.attachments.map((file, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <i className="bi bi-file-earmark me-2"></i>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        {file.filename}
                      </a>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            <hr />

            {/* Grading Form */}
            <h6 className="mb-3">Enter Grade</h6>

            <Form.Group className="mb-3">
              <Form.Label>Grade (out of {assignment?.maxScore}) *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max={assignment?.maxScore}
                step="0.5"
                value={gradeData.grade}
                onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                placeholder={`Enter grade between 0 and ${assignment?.maxScore}`}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Feedback</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                placeholder="Provide detailed feedback to help the student improve..."
              />
              <Form.Text className="text-muted">
                Feedback will be visible to the student
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGradeModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              <i className="bi bi-check-circle me-2"></i>
              Submit Grade
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Assignment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditAssignment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={editingAssignment?.title || ''}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingAssignment?.description || ''}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={editingAssignment?.dueDate || ''}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, dueDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Score</Form.Label>
                  <Form.Control
                    type="number"
                    value={editingAssignment?.maxScore || 100}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, maxScore: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Late Submission Penalty (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editingAssignment?.lateSubmissionPenalty || 10}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, lateSubmissionPenalty: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Allow Late Submission"
                    checked={editingAssignment?.allowLateSubmission || false}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, allowLateSubmission: e.target.checked })}
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingAssignment?.instructions || ''}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, instructions: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editingAssignment?.status || 'draft'}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, status: e.target.value })}
              >
                <option value="draft">Draft (not visible to students)</option>
                <option value="published">Published (visible to students)</option>
                <option value="closed">Closed (no more submissions)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-save me-2"></i>
              Update Assignment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <Alert.Heading>Are you sure?</Alert.Heading>
            <p>
              You are about to delete the assignment: <strong>{assignment?.title}</strong>
            </p>
            <hr />
            <p className="mb-0">
              This action cannot be undone. All student submissions for this assignment will also be deleted.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAssignment}>
            <i className="bi bi-trash me-2"></i>
            Delete Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reopen Assignment Modal */}
      <Modal show={showReopenModal} onHide={() => setShowReopenModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reopen Assignment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReopenAssignment}>
          <Modal.Body>
            <Alert variant="info">
              <Alert.Heading>
                <i className="bi bi-info-circle me-2"></i>
                Reopening: {assignment?.title}
              </Alert.Heading>
              <p className="mb-2">
                Please set a new due date for this assignment. The assignment will be published and students will be able to submit their work.
              </p>
              <p className="mb-0">
                <strong>Previous Due Date:</strong> {assignment && format(new Date(assignment.dueDate), 'PPP p')}
              </p>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>New Due Date *</Form.Label>
              <Form.Control
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Choose a future date and time for the new deadline
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReopenModal(false)}>
              Cancel
            </Button>
            <Button variant="info" type="submit">
              <i className="bi bi-unlock me-2"></i>
              Reopen Assignment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AssignmentDetail;
