import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'event',
    startDate: '',
    endDate: '',
    location: '',
    allDay: false
  });
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = new Date();
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/calendar/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      const formattedEvents = data.map(event => ({
        ...event,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        title: event.title
      }));

      setEvents(formattedEvents);
    } catch (error) {
      toast.error('Failed to fetch events');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/calendar/events`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Event created successfully!');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        type: 'event',
        startDate: '',
        endDate: '',
        location: '',
        allDay: false
      });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    setFormData({
      ...formData,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event) => {
    const colors = {
      class: '#667eea',
      exam: '#f56565',
      assignment: '#ed8936',
      holiday: '#48bb78',
      event: '#4299e1',
      meeting: '#9f7aea'
    };

    return {
      style: {
        backgroundColor: colors[event.type] || '#667eea',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const getEventTypeBadge = (type) => {
    const badges = {
      class: 'primary',
      exam: 'danger',
      assignment: 'warning',
      holiday: 'success',
      event: 'info',
      meeting: 'secondary'
    };
    return badges[type] || 'secondary';
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col lg={9}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📅 Calendar</h5>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-circle me-2"></i>
                Add Event
              </Button>
            </Card.Header>
            <Card.Body style={{ height: '600px' }}>
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
                popup
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3}>
          <Card className="shadow-sm mb-3">
            <Card.Header>
              <h6 className="mb-0">Upcoming Events</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {events
                .filter(e => new Date(e.start) >= new Date())
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 10)
                .map(event => (
                  <div key={event._id} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <small className="text-muted">
                        {moment(event.start).format('MMM DD, YYYY')}
                      </small>
                      <Badge bg={getEventTypeBadge(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                    <div className="fw-bold">{event.title}</div>
                    {event.location && (
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1"></i>
                        {event.location}
                      </small>
                    )}
                  </div>
                ))}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Event Types</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="primary">Class</Badge>
                <Badge bg="danger">Exam</Badge>
                <Badge bg="warning">Assignment</Badge>
                <Badge bg="success">Holiday</Badge>
                <Badge bg="info">Event</Badge>
                <Badge bg="secondary">Meeting</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Event Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Event</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateEvent}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="class">Class</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="holiday">Holiday</option>
                    <option value="event">Event</option>
                    <option value="meeting">Meeting</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Event location"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date & Time *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    required
                    value={formData.startDate ? moment(formData.startDate).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value).toISOString() })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date & Time *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    required
                    value={formData.endDate ? moment(formData.endDate).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value).toISOString() })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="All Day Event"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Event
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Event Modal */}
      <Modal show={!!selectedEvent} onHide={() => setSelectedEvent(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Badge bg={getEventTypeBadge(selectedEvent?.type)}>
              {selectedEvent?.type}
            </Badge>
          </div>
          {selectedEvent?.description && (
            <p>{selectedEvent.description}</p>
          )}
          <div className="mb-2">
            <i className="bi bi-calendar3 me-2"></i>
            <strong>Start:</strong> {moment(selectedEvent?.start).format('MMM DD, YYYY hh:mm A')}
          </div>
          <div className="mb-2">
            <i className="bi bi-calendar3 me-2"></i>
            <strong>End:</strong> {moment(selectedEvent?.end).format('MMM DD, YYYY hh:mm A')}
          </div>
          {selectedEvent?.location && (
            <div>
              <i className="bi bi-geo-alt me-2"></i>
              <strong>Location:</strong> {selectedEvent.location}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CalendarPage;
