import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [voterId, setVoterId] = useState('');
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [registrationData, setRegistrationData] = useState({
    id: '',
    name: '',
    email: '',
    place: '',
    age: ''
  });
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock admin user
  const adminUsers = [
    { username: 'admin', password: 'admin123', name: 'System Administrator' }
  ];

  const handleVoterLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!voterId.trim()) {
      setMessage('Please enter your voter ID');
      setVariant('danger');
      setLoading(false);
      return;
    }

    try {
      // Check if voter is registered
      const response = await fetch('http://localhost:5000/voters');
      if (response.ok) {
        const voters = await response.json();
        const registeredVoter = voters.find(v => v.original_id === voterId.trim());
        
        if (registeredVoter) {
          if (registeredVoter.status === 'Active') {
            // Create voter object with actual data from backend
            const voter = {
              id: registeredVoter.original_id,
              name: registeredVoter.name,
              place: registeredVoter.place,
              email: registeredVoter.email,
              age: registeredVoter.age
            };
            onLogin(voter, 'voter');
            setMessage('');
          } else {
            setMessage(`Your account status is: ${registeredVoter.status}. Please contact administrator.`);
            setVariant('warning');
          }
        } else {
          setMessage('Voter ID not found. Please register first.');
          setVariant('danger');
        }
      } else {
        setMessage('Error connecting to server. Please try again.');
        setVariant('danger');
      }
    } catch (error) {
      setMessage('Error connecting to server. Please check if backend is running.');
      setVariant('danger');
    }
    setLoading(false);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const admin = adminUsers.find(a => a.username === adminCredentials.username && a.password === adminCredentials.password);
    
    if (admin) {
      onLogin(admin, 'admin');
      setMessage('');
    } else {
      setMessage('Invalid admin credentials');
      setVariant('danger');
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields
    if (!registrationData.id || !registrationData.name || !registrationData.email || !registrationData.place || !registrationData.age) {
      setMessage('Please fill all required fields');
      setVariant('danger');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register_voter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: registrationData.id,
          name: registrationData.name,
          email: registrationData.email,
          place: registrationData.place,
          age: registrationData.age
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Registration submitted successfully! Please wait for admin approval.');
        setVariant('success');
        setRegistrationData({ id: '', name: '', email: '', place: '', age: '' });
        setActiveTab('login'); // Switch to login tab after successful registration
      } else {
        setMessage(data.message);
        setVariant('danger');
      }
    } catch (error) {
      setMessage('Error connecting to server. Please try again.');
      setVariant('danger');
    }
    setLoading(false);
  };

  const handleRegistrationChange = (field, value) => {
    setRegistrationData({ ...registrationData, [field]: value });
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6}>
          <Card className="enhanced-card login-card">
            <Card.Header className="card-header-custom text-center">
              <i className="fas fa-vote-yea fa-2x mb-3"></i>
              <h3 className="mb-0">Blockchain Voting System</h3>
              <p className="text-light mb-0 mt-2">Secure • Transparent • Trustworthy</p>
            </Card.Header>
            <Card.Body className="p-4">
              {message && (
                <Alert variant={variant} className={variant === 'success' ? 'alert-custom-success' : 'alert-custom-danger'}>
                  <i className={`fas ${variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                  {message}
                </Alert>
              )}

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => {
                  setActiveTab(k);
                  setMessage(''); // Clear messages when switching tabs
                }}
                className="mb-4 custom-tabs"
                fill
              >
                <Tab eventKey="login" title={
                  <span>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Login
                  </span>
                }>
                  <Form onSubmit={handleVoterLogin} className="mt-3">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-id-card me-2"></i>
                        Voter ID
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your voter ID"
                        value={voterId}
                        onChange={(e) => setVoterId(e.target.value)}
                        className="form-control-custom"
                        required
                        disabled={loading}
                      />
                      <Form.Text className="text-muted">
                        Enter the voter ID you registered with
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid">
                      <Button 
                        type="submit" 
                        className="btn-custom-primary"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sign-in-alt me-2"></i>
                            Login
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>

                  <div className="text-center mt-3">
                    <p className="text-muted">
                      Don't have an account?{' '}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => setActiveTab('register')}
                      >
                        Register here
                      </Button>
                    </p>
                  </div>
                </Tab>

                <Tab eventKey="register" title={
                  <span>
                    <i className="fas fa-user-plus me-2"></i>
                    Register
                  </span>
                }>
                  <Form onSubmit={handleRegistration} className="mt-3">
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-id-card me-2"></i>
                        Voter ID *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Choose a unique voter ID"
                        value={registrationData.id}
                        onChange={(e) => handleRegistrationChange('id', e.target.value)}
                        className="form-control-custom"
                        required
                      />
                      <Form.Text className="text-muted">
                        This will be your login ID
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-user me-2"></i>
                        Full Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={registrationData.name}
                        onChange={(e) => handleRegistrationChange('name', e.target.value)}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-envelope me-2"></i>
                        Email Address *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={registrationData.email}
                        onChange={(e) => handleRegistrationChange('email', e.target.value)}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label-custom">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            Place/City *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter your city"
                            value={registrationData.place}
                            onChange={(e) => handleRegistrationChange('place', e.target.value)}
                            className="form-control-custom"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label-custom">
                            <i className="fas fa-birthday-cake me-2"></i>
                            Age *
                          </Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Enter your age"
                            value={registrationData.age}
                            onChange={(e) => handleRegistrationChange('age', e.target.value)}
                            className="form-control-custom"
                            min="18"
                            max="100"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-grid">
                      <Button 
                        type="submit" 
                        className="btn-custom-primary"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Registering...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus me-2"></i>
                            Register
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>

                  <div className="text-center mt-3">
                    <p className="text-muted">
                      Already have an account?{' '}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => setActiveTab('login')}
                      >
                        Login here
                      </Button>
                    </p>
                  </div>
                </Tab>

                <Tab eventKey="admin" title={
                  <span>
                    <i className="fas fa-lock me-2"></i>
                    Admin
                  </span>
                }>
                  <Form onSubmit={handleAdminLogin} className="mt-3">
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-user-shield me-2"></i>
                        Admin Username
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter admin username"
                        value={adminCredentials.username}
                        onChange={(e) => setAdminCredentials({...adminCredentials, username: e.target.value})}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-key me-2"></i>
                        Admin Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter admin password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>

                    <div className="d-grid">
                      <Button type="submit" className="btn-custom-primary" size="lg">
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Admin Login
                      </Button>
                    </div>
                  </Form>

                  <div className="text-center mt-4">
                    <p className="text-muted mb-2">Admin Account:</p>
                    <div className="small text-muted">
                      <div>Username: admin | Password: admin123</div>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>

          <Card className="enhanced-card mt-4">
            <Card.Body className="text-center">
              <h6 className="text-primary mb-3">
                <i className="fas fa-info-circle me-2"></i>
                About This System
              </h6>
              <p className="text-muted small mb-0">
                Secure blockchain-based voting system that ensures transparency
                and prevents tampering through distributed ledger technology.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;