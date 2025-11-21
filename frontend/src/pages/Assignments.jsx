import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Modal, Tab, Tabs, Alert } from 'react-bootstrap';
import API from '../api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submission, setSubmission] = useState({ textContent: '', attachments: [] });
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [reopeningAssignment, setReopeningAssignment] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    maxScore: 100,
    instructions: '',
    allowLateSubmission: true,
    lateSubmissionPenalty: 10,
    status: 'draft'
  });
  const [filter, setFilter] = useState('all');
  const user = JSON.parse(localStorage.getItem('user'));
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchAssignments();
    if (!isStudent) {
      fetchSubjects();
    }
  }, [filter]);

  const fetchSubjects = async () => {
    try {
      const { data } = await API.get('/subjects');
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      
      // For teachers, apply the filter. For students, don't filter by status (get all published and closed)
      if (!isStudent && filter !== 'all') {
        params.status = filter;
      }
      
      console.log('Fetching assignments with params:', params, 'User role:', user?.role);
      const { data } = await API.get('/assignments', { params });
      console.log('✅ Fetched assignments:', data.assignments.length, 'assignments');
      console.log('Assignment details:', data.assignments.map(a => ({ 
        id: a._id, 
        title: a.title, 
        status: a.status,
        dueDate: a.dueDate 
      })));
      setAssignments(data.assignments);
    } catch (error) {
      toast.error('Failed to fetch assignments');
      console.error('❌ Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isCreating) {
      console.log('Assignment creation already in progress...');
      return;
    }

    try {
      setIsCreating(true);
      await API.post('/assignments', newAssignment);
      toast.success('Assignment created successfully!');
      setShowCreateModal(false);
      setNewAssignment({
        title: '',
        description: '',
        subject: '',
        dueDate: '',
        maxScore: 100,
        instructions: '',
        allowLateSubmission: true,
        lateSubmissionPenalty: 10,
        status: 'draft'
      });
      fetchAssignments();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.warning('This assignment already exists!');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create assignment');
      }
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/assignments/${selectedAssignment._id}/submit`, submission);
      toast.success('Assignment submitted successfully!');
      setShowModal(false);
      setSubmission({ textContent: '', attachments: [] });
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
      console.error(error);
    }
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/assignments/${editingAssignment._id}`, editingAssignment);
      toast.success('Assignment updated successfully!');
      setShowEditModal(false);
      setEditingAssignment(null);
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update assignment');
      console.error(error);
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      await API.delete(`/assignments/${deletingAssignment._id}`);
      toast.success('Assignment deleted successfully!');
      setShowDeleteModal(false);
      setDeletingAssignment(null);
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
      console.error(error);
    }
  };

  const handleStatusChange = async (assignmentId, newStatus) => {
    try {
      await API.put(`/assignments/${assignmentId}`, { status: newStatus });
      toast.success(`Assignment ${newStatus === 'published' ? 'published' : newStatus === 'closed' ? 'closed' : 'saved as draft'} successfully!`);
      fetchAssignments();
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
    const oldDate = new Date(reopeningAssignment.dueDate);
    if (selectedDate.getTime() === oldDate.getTime()) {
      toast.error('Please select a new due date!');
      return;
    }
    
    try {
      await API.put(`/assignments/${reopeningAssignment._id}`, { 
        status: 'published',
        dueDate: newDueDate 
      });
      toast.success('Assignment reopened successfully with new due date!');
      setShowReopenModal(false);
      setReopeningAssignment(null);
      setNewDueDate('');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen assignment');
      console.error(error);
    }
  };

  const getStatusBadge = (assignment) => {
    if (!isStudent) return <Badge bg="info">Published</Badge>;
    
    const { submissionStatus } = assignment;
    if (submissionStatus === 'graded') return <Badge bg="success">Graded</Badge>;
    if (submissionStatus === 'submitted') return <Badge bg="warning">Submitted</Badge>;
    
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    if (now > dueDate) return <Badge bg="danger">Overdue</Badge>;
    return <Badge bg="primary">Pending</Badge>;
  };

  const getDaysLeft = (dueDate) => {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📝 Assignments</h2>
        {!isStudent && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Create Assignment
          </Button>
        )}
      </div>

      {/* Only show tabs for teachers */}
      {!isStudent && (
        <Tabs activeKey={filter} onSelect={setFilter} className="mb-4">
          <Tab eventKey="all" title="All" />
          <Tab eventKey="published" title="Published" />
          <Tab eventKey="draft" title="Drafts" />
        </Tabs>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h5>No assignments found</h5>
            <p className="text-muted">Check back later for new assignments</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {assignments.map((assignment) => (
            <Col md={6} lg={4} key={assignment._id} className="mb-4">
              <Card className="h-100 shadow-sm hover-shadow">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="mb-0">{assignment.title}</h5>
                    {getStatusBadge(assignment)}
                  </div>
                  
                  <p className="text-muted small mb-2">
                    <i className="bi bi-book me-2"></i>
                    {assignment.subject?.name}
                  </p>
                  
                  <p className="mb-3" style={{ fontSize: '0.9rem' }}>
                    {assignment.description.substring(0, 100)}
                    {assignment.description.length > 100 && '...'}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <i className="bi bi-calendar3 me-2"></i>
                      <small className="text-muted">
                        Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                      </small>
                    </div>
                    <Badge bg={new Date(assignment.dueDate) > new Date() ? 'success' : 'danger'}>
                      {getDaysLeft(assignment.dueDate)}
                    </Badge>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                      <i className="bi bi-trophy me-1"></i>
                      {assignment.maxScore} points
                    </span>
                    {isStudent && assignment.submissionGrade && (
                      <Badge bg="success">
                        Score: {assignment.submissionGrade}/{assignment.maxScore}
                      </Badge>
                    )}
                  </div>
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <div className="d-flex gap-2 flex-wrap">
                    <Link to={`/assignments/${assignment._id}`} className="flex-grow-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="w-100"
                      >
                        View Details
                      </Button>
                    </Link>
                    
                    {/* Teacher Actions */}
                    {!isStudent && (
                      <>
                        <Button
                          variant="outline-secondary"
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
                          <i className="bi bi-pencil"></i>
                        </Button>
                        
                        {assignment.status === 'draft' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleStatusChange(assignment._id, 'published')}
                            title="Publish Assignment"
                          >
                            <i className="bi bi-check-circle"></i>
                          </Button>
                        )}
                        
                        {assignment.status === 'published' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleStatusChange(assignment._id, 'closed')}
                            title="Close Assignment"
                          >
                            <i className="bi bi-unlock"></i>
                          </Button>
                        )}
                        
                        {assignment.status === 'closed' && (
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              setReopeningAssignment(assignment);
                              setNewDueDate(''); // Start with empty to force new selection
                              setShowReopenModal(true);
                            }}
                            title="Reopen Assignment"
                          >
                            <i className="bi bi-lock"></i>
                          </Button>
                        )}
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setDeletingAssignment(assignment);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Assignment"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </>
                    )}
                    {isStudent && assignment.submissionStatus !== 'graded' && (() => {
                      const isPastDue = new Date(assignment.dueDate) < new Date();
                      const isClosed = assignment.status === 'closed';
                      const canSubmit = !isClosed && (!isPastDue || assignment.allowLateSubmission);
                      
                      if (isClosed) {
                        return (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-grow-1"
                            disabled
                            title="Assignment is closed by teacher"
                          >
                            <i className="bi bi-lock me-1"></i>
                            Closed
                          </Button>
                        );
                      }
                      
                      if (!canSubmit) {
                        return (
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-grow-1"
                            disabled
                            title="Deadline passed and late submission not allowed"
                          >
                            Deadline Passed
                          </Button>
                        );
                      }
                      
                      return (
                        <Button
                          variant={isPastDue ? "warning" : "primary"}
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowModal(true);
                          }}
                          title={isPastDue ? "Late submission allowed with penalty" : "Submit on time"}
                        >
                          {isPastDue && assignment.allowLateSubmission && (
                            <i className="bi bi-exclamation-triangle me-1"></i>
                          )}
                          {assignment.submissionStatus === 'submitted' ? 'Resubmit' : 'Submit'}
                          {isPastDue && assignment.allowLateSubmission && ` (Late)`}
                        </Button>
                      );
                    })()}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Submit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submit Assignment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <h6>{selectedAssignment?.title}</h6>
            <p className="text-muted small mb-3">{selectedAssignment?.subject?.name}</p>
            
            {/* Late Submission Warning */}
            {selectedAssignment && new Date(selectedAssignment.dueDate) < new Date() && selectedAssignment.allowLateSubmission && (
              <Alert variant="warning" className="mb-3">
                <Alert.Heading className="h6">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Late Submission
                </Alert.Heading>
                <p className="mb-1">
                  The deadline for this assignment has passed. A penalty of <strong>{selectedAssignment.lateSubmissionPenalty}%</strong> will be applied to your grade.
                </p>
                <small className="text-muted">
                  Original Due Date: {format(new Date(selectedAssignment.dueDate), 'PPP p')}
                </small>
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Submission Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={submission.textContent}
                onChange={(e) => setSubmission({ ...submission, textContent: e.target.value })}
                placeholder="Enter your submission text..."
                required
              />
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Attachments (Optional)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files).map(f => ({
                    filename: f.name,
                    url: URL.createObjectURL(f)
                  }));
                  setSubmission({ ...submission, attachments: files });
                }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Assignment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Assignment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateAssignment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder="Assignment title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                placeholder="Assignment description"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Select
                    value={newAssignment.subject}
                    onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Score</Form.Label>
                  <Form.Control
                    type="number"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Late Submission Penalty (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={newAssignment.lateSubmissionPenalty}
                    onChange={(e) => setNewAssignment({ ...newAssignment, lateSubmissionPenalty: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                placeholder="Additional instructions for students"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Allow Late Submission"
                checked={newAssignment.allowLateSubmission}
                onChange={(e) => setNewAssignment({ ...newAssignment, allowLateSubmission: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={newAssignment.status}
                onChange={(e) => setNewAssignment({ ...newAssignment, status: e.target.value })}
              >
                <option value="draft">Draft (not visible to students)</option>
                <option value="published">Published (visible to students)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                'Create Assignment'
              )}
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
                  <Form.Label>Subject *</Form.Label>
                  <Form.Select
                    value={editingAssignment?.subject || ''}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, subject: e.target.value })}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

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
            </Row>

            <Row>
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
              <Form.Check
                type="checkbox"
                label="Allow Late Submission"
                checked={editingAssignment?.allowLateSubmission || false}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, allowLateSubmission: e.target.checked })}
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
              You are about to delete the assignment: <strong>{deletingAssignment?.title}</strong>
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
                Reopening: {reopeningAssignment?.title}
              </Alert.Heading>
              <p className="mb-2">
                Please set a new due date for this assignment. The assignment will be published and students will be able to submit their work.
              </p>
              <p className="mb-0">
                <strong>Previous Due Date:</strong> {reopeningAssignment && format(new Date(reopeningAssignment.dueDate), 'PPP p')}
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

export default Assignments;
