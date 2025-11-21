import React, { useState, useEffect } from 'react';
import { Container, Form, InputGroup, Card, Row, Col, Badge, Tabs, Tab, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length >= 2) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/search/suggestions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: query, limit: 5 }
        }
      );
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/search`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: query, limit: 20 }
        }
      );
      setResults(data);
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    const icons = {
      user: 'bi-person-circle',
      subject: 'bi-book',
      assignment: 'bi-clipboard-check',
      notice: 'bi-megaphone',
      upload: 'bi-file-earmark'
    };
    return icons[type] || 'bi-search';
  };

  const handleResultClick = (type, id) => {
    switch (type) {
      case 'users':
        navigate(`/profile/${id}`);
        break;
      case 'subjects':
        navigate(`/subjects/${id}`);
        break;
      case 'assignments':
        navigate(`/assignments/${id}`);
        break;
      case 'notices':
        navigate(`/notices/${id}`);
        break;
      case 'uploads':
        navigate(`/uploads/${id}`);
        break;
      default:
        break;
    }
  };

  const renderResults = (type, items) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-muted text-center py-3">
          No {type} found
        </p>
      );
    }

    return items.map((item, index) => (
      <Card
        key={index}
        className="mb-2 hover-shadow cursor-pointer"
        onClick={() => handleResultClick(type, item._id)}
        style={{ cursor: 'pointer' }}
      >
        <Card.Body className="d-flex align-items-center gap-3">
          <i className={`${getIconForType(type.slice(0, -1))} fs-2 text-primary`}></i>
          <div className="flex-grow-1">
            <h6 className="mb-1">
              {item.name || item.title || item.fileName}
            </h6>
            <small className="text-muted">
              {type === 'users' && (
                <>
                  {item.email} • <Badge bg="secondary">{item.role}</Badge>
                </>
              )}
              {type === 'subjects' && (
                <>
                  {item.code} • {item.teacher?.name}
                </>
              )}
              {type === 'assignments' && (
                <>
                  {item.subject?.name} • Due: {new Date(item.dueDate).toLocaleDateString()}
                </>
              )}
              {type === 'notices' && (
                <>
                  By {item.createdBy?.name} • {new Date(item.createdAt).toLocaleDateString()}
                </>
              )}
              {type === 'uploads' && (
                <>
                  {item.subject?.name} • By {item.uploadedBy?.name}
                </>
              )}
            </small>
          </div>
          <i className="bi bi-chevron-right text-muted"></i>
        </Card.Body>
      </Card>
    ));
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">🔍 Search</h2>

      <Form onSubmit={handleSearch}>
        <InputGroup size="lg" className="mb-4">
          <Form.Control
            type="text"
            placeholder="Search for users, subjects, assignments, notices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Searching...
              </>
            ) : (
              <>
                <i className="bi bi-search me-2"></i>
                Search
              </>
            )}
          </Button>
        </InputGroup>
      </Form>

      {/* Search suggestions */}
      {suggestions.length > 0 && !results && (
        <Card className="mb-4">
          <Card.Body>
            <h6 className="mb-3">Suggestions</h6>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="d-flex align-items-center gap-2 py-2 px-2 rounded hover-bg cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => setQuery(suggestion.label)}
              >
                <i className={`bi-${suggestion.icon}`}></i>
                <span>{suggestion.label}</span>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Search results */}
      {results && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Search Results for "{results.query}"</h5>
            <Badge bg="primary">{results.totalResults} total results</Badge>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="all" title={`All (${results.totalResults})`}>
              <Row>
                {Object.entries(results.results).map(([type, items]) => (
                  items.length > 0 && (
                    <Col md={12} key={type} className="mb-4">
                      <h6 className="text-capitalize mb-3">{type} ({items.length})</h6>
                      {renderResults(type, items)}
                    </Col>
                  )
                ))}
              </Row>
            </Tab>

            <Tab eventKey="users" title={`Users (${results.results.users.length})`}>
              {renderResults('users', results.results.users)}
            </Tab>

            <Tab eventKey="subjects" title={`Subjects (${results.results.subjects.length})`}>
              {renderResults('subjects', results.results.subjects)}
            </Tab>

            <Tab eventKey="assignments" title={`Assignments (${results.results.assignments.length})`}>
              {renderResults('assignments', results.results.assignments)}
            </Tab>

            <Tab eventKey="notices" title={`Notices (${results.results.notices.length})`}>
              {renderResults('notices', results.results.notices)}
            </Tab>

            <Tab eventKey="uploads" title={`Files (${results.results.uploads.length})`}>
              {renderResults('uploads', results.results.uploads)}
            </Tab>
          </Tabs>
        </div>
      )}

      {!results && !loading && (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
            <h5>Start searching</h5>
            <p className="text-muted">
              Enter a query above to search across users, subjects, assignments, notices, and files
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default SearchPage;
