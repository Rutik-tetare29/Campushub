import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const features = [
    {
      icon: 'bi-calendar-check',
      title: 'Class Scheduling',
      description: 'Manage and view your class schedule with ease',
      color: '#667eea'
    },
    {
      icon: 'bi-book',
      title: 'Subject Management',
      description: 'Access course materials and assignments',
      color: '#f093fb'
    },
    {
      icon: 'bi-megaphone',
      title: 'Notice Board',
      description: 'Stay updated with important announcements',
      color: '#feca57'
    },
    {
      icon: 'bi-chat-dots',
      title: 'Real-time Chat',
      description: 'Connect with teachers and classmates instantly',
      color: '#48dbfb'
    },
    {
      icon: 'bi-cloud-upload',
      title: 'File Sharing',
      description: 'Upload and download study materials',
      color: '#1dd1a1'
    },
    {
      icon: 'bi-bell',
      title: 'Live Notifications',
      description: 'Get instant updates on important events',
      color: '#ff6b6b'
    }
  ];

  return (
    <div className="home-page">
      {/* Debug: Clear localStorage button */}
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '10px 20px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        🔄 Clear Cache & Restart
      </button>
      
      {/* Hero Section */}
      <section className="hero-section">
        <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
          <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="#">
              <i className="bi bi-mortarboard-fill me-2 fs-3"></i>
              <span className="fw-bold fs-4">Campus Connect</span>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item">
                  <a className="nav-link" href="#features">Features</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#contact">Contact</a>
                </li>
                <li className="nav-item ms-lg-3">
                  <button 
                    className="btn btn-outline-light px-4 me-2"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Login
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="btn btn-light px-4 fw-semibold"
                    onClick={() => setShowSignupModal(true)}
                  >
                    Sign Up
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="hero-content">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="hero-text" data-aos="fade-right">
                  <h1 className="display-3 fw-bold mb-4">
                    Welcome to <span className="gradient-text">Campus Connect</span>
                  </h1>
                  <p className="lead mb-5">
                    Your complete college management solution. Stay connected, organized, and ahead with our powerful platform designed for students, teachers, and administrators.
                  </p>
                  <div className="d-flex gap-3 flex-wrap">
                    <button 
                      className="btn btn-primary btn-lg px-5 py-3 fw-semibold"
                      onClick={() => setShowSignupModal(true)}
                    >
                      Get Started <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                    <button 
                      className="btn btn-outline-light btn-lg px-5 py-3"
                      onClick={() => setShowLoginModal(true)}
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="hero-image" data-aos="fade-left">
                  <div className="floating-card card-1">
                    <i className="bi bi-calendar-check"></i>
                    <span>Schedule</span>
                  </div>
                  <div className="floating-card card-2">
                    <i className="bi bi-chat-dots"></i>
                    <span>Chat</span>
                  </div>
                  <div className="floating-card card-3">
                    <i className="bi bi-bell"></i>
                    <span>Notifications</span>
                  </div>
                  <div className="hero-illustration">
                    <i className="bi bi-laptop display-1"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background */}
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Powerful Features</h2>
            <p className="lead text-muted">Everything you need to manage your campus life</p>
          </div>
          
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="feature-card h-100">
                  <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}>
                    <i className={feature.icon}></i>
                  </div>
                  <h4 className="fw-bold mb-3">{feature.title}</h4>
                  <p className="text-muted mb-0">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3 col-6 mb-4">
              <div className="stat-card">
                <i className="bi bi-people-fill"></i>
                <h3 className="fw-bold">10,000+</h3>
                <p className="stat-label">Students</p>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-4">
              <div className="stat-card">
                <i className="bi bi-person-badge"></i>
                <h3 className="fw-bold">500+</h3>
                <p className="stat-label">Teachers</p>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-4">
              <div className="stat-card">
                <i className="bi bi-journal-bookmark"></i>
                <h3 className="fw-bold">200+</h3>
                <p className="stat-label">Courses</p>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-4">
              <div className="stat-card">
                <i className="bi bi-trophy"></i>
                <h3 className="fw-bold">98%</h3>
                <p className="stat-label">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="display-5 fw-bold mb-4">About Campus Connect</h2>
              <p className="lead mb-4">
                Campus Connect is a comprehensive college management system designed to streamline communication and organization in educational institutions.
              </p>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Real-time Updates:</strong> Stay informed with instant notifications
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Easy Collaboration:</strong> Connect with peers and teachers effortlessly
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Secure & Reliable:</strong> Your data is protected with industry-standard security
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Mobile Friendly:</strong> Access anywhere, anytime from any device
                </li>
              </ul>
            </div>
            <div className="col-lg-6">
              <div className="about-image">
                <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600" alt="Students" className="img-fluid rounded-4 shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Get In Touch</h2>
            <p className="lead text-muted">Have questions? We'd love to hear from you.</p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="contact-card">
                <div className="row g-4">
                  <div className="col-md-4 text-center">
                    <div className="contact-item">
                      <i className="bi bi-geo-alt-fill"></i>
                      <h5 className="mt-3 mb-2">Location</h5>
                      <p className="text-muted mb-0">123 Campus Road<br/>City, State 12345</p>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="contact-item">
                      <i className="bi bi-envelope-fill"></i>
                      <h5 className="mt-3 mb-2">Email</h5>
                      <p className="text-muted mb-0">info@campus.edu<br/>support@campus.edu</p>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="contact-item">
                      <i className="bi bi-telephone-fill"></i>
                      <h5 className="mt-3 mb-2">Phone</h5>
                      <p className="text-muted mb-0">+1 (555) 123-4567<br/>Mon-Fri 9am-5pm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0">&copy; 2025 Campus Connect. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <a href="#" className="text-decoration-none me-3">Privacy Policy</a>
              <a href="#" className="text-decoration-none me-3">Terms of Service</a>
              <a href="#" className="text-decoration-none">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} navigate={navigate} />
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <SignupModal onClose={() => setShowSignupModal(false)} navigate={navigate} />
      )}
    </div>
  );
}

// Login Modal Component
function LoginModal({ onClose, navigate }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Force page reload to update App.jsx user state
        window.location.href = '/dashboard';
      } else {
        setError(data.message || data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
        
        <div className="modal-header">
          <i className="bi bi-box-arrow-in-right modal-icon"></i>
          <h2 className="fw-bold mb-2">Welcome Back!</h2>
          <p className="text-muted">Sign in to continue to Campus Connect</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control"
              id="loginEmail"
              placeholder=" "
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <label htmlFor="loginEmail">
              <i className="bi bi-envelope me-2"></i>Email address
            </label>
          </div>

          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control"
              id="loginPassword"
              placeholder=" "
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <label htmlFor="loginPassword">
              <i className="bi bi-lock me-2"></i>Password
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 fw-semibold mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In <i className="bi bi-arrow-right ms-2"></i>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-muted mb-3">Demo Accounts:</p>
            <div className="demo-accounts">
              <small className="d-block mb-1">
                <strong>Teacher:</strong> teacher@campus.edu / teacher123
              </small>
              <small className="d-block">
                <strong>Admin:</strong> admin@campus.edu / admin123
              </small>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Signup Modal Component
function SignupModal({ onClose, navigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Force page reload to update App.jsx user state
        window.location.href = '/dashboard';
      } else {
        setError(data.message || data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
        
        <div className="modal-header">
          <i className="bi bi-person-plus modal-icon"></i>
          <h2 className="fw-bold mb-2">Create Account</h2>
          <p className="text-muted">Join Campus Connect today</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="signupName"
              placeholder=" "
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <label htmlFor="signupName">
              <i className="bi bi-person me-2"></i>Full Name
            </label>
          </div>

          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control"
              id="signupEmail"
              placeholder=" "
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <label htmlFor="signupEmail">
              <i className="bi bi-envelope me-2"></i>Email address
            </label>
          </div>

          <div className="form-floating mb-3">
            <input
              type="password"
              className="form-control"
              id="signupPassword"
              placeholder=" "
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength="6"
            />
            <label htmlFor="signupPassword">
              <i className="bi bi-lock me-2"></i>Password (min 6 characters)
            </label>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">
              <i className="bi bi-person-badge me-2"></i>Select Role
            </label>
            <div className="role-selection">
              <div className="role-option">
                <input
                  type="radio"
                  className="btn-check"
                  name="role"
                  id="roleStudent"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                <label className="btn btn-outline-primary w-100" htmlFor="roleStudent">
                  <i className="bi bi-person-circle d-block fs-2 mb-2"></i>
                  <strong>Student</strong>
                  <small className="d-block text-muted">Access courses & materials</small>
                </label>
              </div>

              <div className="role-option">
                <input
                  type="radio"
                  className="btn-check"
                  name="role"
                  id="roleTeacher"
                  value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                <label className="btn btn-outline-primary w-100" htmlFor="roleTeacher">
                  <i className="bi bi-person-video3 d-block fs-2 mb-2"></i>
                  <strong>Teacher</strong>
                  <small className="d-block text-muted">Manage classes & students</small>
                </label>
              </div>
            </div>
            <small className="text-muted d-block mt-2">
              <i className="bi bi-info-circle me-1"></i>
              Note: Admin accounts are managed by administrators only
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 fw-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Creating account...
              </>
            ) : (
              <>
                Create Account <i className="bi bi-arrow-right ms-2"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;
