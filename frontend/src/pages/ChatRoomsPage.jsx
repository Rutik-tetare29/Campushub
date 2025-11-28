import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import API from '../api';

const ChatRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    maxMembers: 50,
    allowStudentJoin: true
  });
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await API.get('/chatrooms');
      setRooms(data);
    } catch (error) {
      toast.error('Failed to fetch chat rooms');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      // Format data to match backend schema
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        settings: {
          maxMembers: formData.maxMembers,
          allowJoin: formData.allowStudentJoin
        }
      };

      await API.post('/chatrooms', payload);
      toast.success('Chat room created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        type: 'general',
        maxMembers: 50,
        allowStudentJoin: true
      });
      fetchRooms();
    } catch (error) {
      console.error('Create room error:', error);
      toast.error(error.response?.data?.message || 'Failed to create chat room');
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await API.post(`/chatrooms/${roomId}/join`);
      toast.success('Joined room successfully!');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    }
  };

  const handleLeaveRoom = async (roomId) => {
    try {
      await API.post(`/chatrooms/${roomId}/leave`);
      toast.success('Left room successfully!');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave room');
    }
  };

  const getRoomTypeBadge = (type) => {
    const badges = {
      general: { bg: 'primary', icon: '💬' },
      subject: { bg: 'success', icon: '📚' },
      private: { bg: 'warning', icon: '🔒' },
      announcement: { bg: 'danger', icon: '📢' }
    };
    return badges[type] || badges.general;
  };

  const isMember = (room) => {
    return room.members?.some(m => m.user?._id === user._id || m.user === user._id);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>💬 Chat Rooms</h2>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>
            Create Room
          </Button>
        )}
      </div>

      <Row>
        {rooms.map(room => {
          const badge = getRoomTypeBadge(room.type);
          const memberCount = room.members?.length || 0;
          const maxMembers = room.settings?.maxMembers || 100;
          const allowJoin = room.settings?.allowJoin !== false;
          const isFull = maxMembers && memberCount >= maxMembers;
          const userIsMember = isMember(room);

          return (
            <Col md={6} lg={4} key={room._id} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ fontSize: '2rem' }}>{badge.icon}</div>
                    <Badge bg={badge.bg}>{room.type}</Badge>
                  </div>
                  
                  <h5 className="mb-2">{room.name}</h5>
                  <p className="text-muted small mb-3">{room.description}</p>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex gap-3">
                      <small className="text-muted">
                        <i className="bi bi-people-fill me-1"></i>
                        {memberCount}/{maxMembers}
                      </small>
                      {room.lastMessageAt && (
                        <small className="text-muted">
                          <i className="bi bi-chat-dots me-1"></i>
                          Active
                        </small>
                      )}
                    </div>
                    {room.subject && (
                      <Badge bg="info" pill>
                        {room.subject.name}
                      </Badge>
                    )}
                  </div>

                  {userIsMember ? (
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => window.location.href = `/chatrooms/${room._id}`}
                      >
                        <i className="bi bi-box-arrow-in-right me-1"></i>
                        Open
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleLeaveRoom(room._id)}
                      >
                        Leave
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100"
                      disabled={isFull || (!allowJoin && user.role === 'student')}
                      onClick={() => handleJoinRoom(room._id)}
                    >
                      {isFull ? (
                        <>
                          <i className="bi bi-lock-fill me-1"></i>
                          Room Full
                        </>
                      ) : !allowJoin && user.role === 'student' ? (
                        <>
                          <i className="bi bi-lock-fill me-1"></i>
                          Invite Only
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-1"></i>
                          Join Room
                        </>
                      )}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {rooms.length === 0 && (
        <Card className="text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
            <h5>No chat rooms available</h5>
            <p className="text-muted">
              {user.role === 'student'
                ? 'No chat rooms have been created yet.'
                : 'Create your first chat room to get started!'}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Create Room Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Chat Room</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateRoom}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Room Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter room name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Room description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Room Type *</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="general">General - Open to all</option>
                <option value="subject">Subject - For specific subject</option>
                <option value="private">Private - Invite only</option>
                <option value="announcement">Announcement - Read only</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Max Members</Form.Label>
              <Form.Control
                type="number"
                min="2"
                max="500"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Allow students to join"
                checked={formData.allowStudentJoin}
                onChange={(e) => setFormData({ ...formData, allowStudentJoin: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Room
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ChatRoomsPage;
