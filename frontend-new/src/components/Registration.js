import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';

const Registration = () => {
  const [voterId, setVoterId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!voterId || !adminKey) {
      setMessage('Please fill all fields');
      setVariant('danger');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voter_id: voterId,
          admin_key: adminKey
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Voter registered successfully! This voter can now cast their vote.');
        setVariant('success');
        setVoterId('');
        setAdminKey('');
      } else {
        setMessage(data.message);
        setVariant('danger');
      }
    } catch (error) {
      setMessage('Error connecting to server. Please check if the backend is running.');
      setVariant('danger');
    }
    setLoading(false);
  };

  return (
    <Row className="justify-content-center">
      <Col md={8} lg={6}>
        <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
          <i className="fas fa-user-plus me-2"></i>
          Voter Registration
        </h2>
        
        <Alert variant="warning" className="alert-custom-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Admin Access Only:</strong> This section is restricted to authorized personnel.
        </Alert>
        
        {message && (
          <Alert variant={variant} className={variant === 'success' ? 'alert-custom-success' : 'alert-custom-danger'}>
            <i className={`fas ${variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
            {message}
          </Alert>
        )}
        
        <Card className="enhanced-card">
          <Card.Header className="card-header-custom">
            <i className="fas fa-lock me-2"></i>
            Admin Registration Panel
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit} className="enhanced-form">
              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">
                  <i className="fas fa-id-card me-2"></i>
                  Voter ID
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter voter ID to register"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  className="form-control-custom"
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  This will be the ID the voter uses to cast their ballot.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">
                  <i className="fas fa-key me-2"></i>
                  Admin Key
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter admin authentication key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="form-control-custom"
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  Required for security authentication.
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
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Register Voter
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card className="enhanced-card mt-4">
          <Card.Header className="card-header-custom">
            <i className="fas fa-list-alt me-2"></i>
            Registration Guidelines
          </Card.Header>
          <Card.Body>
            <h6 className="text-primary mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Important Information
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                Each voter must be registered before they can vote
              </li>
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                Voter IDs are hashed for security and privacy
              </li>
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                Default admin key is <code>admin123</code>
              </li>
              <li className="mb-0">
                <i className="fas fa-check-circle text-success me-2"></i>
                Once registered, voters cannot be removed (immutable blockchain)
              </li>
            </ul>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Registration;