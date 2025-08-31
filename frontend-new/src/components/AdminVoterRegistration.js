import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';

const AdminVoterRegistration = () => {
  const [voterData, setVoterData] = useState({
    id: '',
    name: '',
    email: '',
    place: '',
    age: ''
  });
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate all fields
    if (!voterData.id || !voterData.name || !voterData.email || !voterData.place || !voterData.age) {
      setMessage('Please fill all required fields');
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
          voter_id: voterData.id,
          name: voterData.name,
          email: voterData.email,
          place: voterData.place,
          age: voterData.age,
          admin_key: 'admin123'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Voter registered successfully! The voter is now pending admin approval.');
        setVariant('success');
        setVoterData({ id: '', name: '', email: '', place: '', age: '' });
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

  const handleInputChange = (field, value) => {
    setVoterData({ ...voterData, [field]: value });
  };

  return (
    <div>
      <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
        <i className="fas fa-user-plus me-2"></i>
        Voter Registration
      </h2>

      <Row>
        <Col md={8} className="mx-auto">
          <Card className="enhanced-card">
            <Card.Header className="card-header-custom">
              <i className="fas fa-user-edit me-2"></i>
              Register New Voter
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant={variant} className={variant === 'success' ? 'alert-custom-success' : 'alert-custom-danger'}>
                  <i className={`fas ${variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                  {message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-id-card me-2"></i>
                        Voter ID *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter unique voter ID"
                        value={voterData.id}
                        onChange={(e) => handleInputChange('id', e.target.value)}
                        className="form-control-custom"
                        required
                      />
                      <Form.Text className="text-muted">
                        This will be the ID used for login
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-user me-2"></i>
                        Full Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter voter's full name"
                        value={voterData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="form-label-custom">
                    <i className="fas fa-envelope me-2"></i>
                    Email Address *
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter voter's email"
                    value={voterData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                        placeholder="Enter city/place"
                        value={voterData.place}
                        onChange={(e) => handleInputChange('place', e.target.value)}
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
                        placeholder="Enter age"
                        value={voterData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
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
              <i className="fas fa-info-circle me-2"></i>
              Registration Process
            </Card.Header>
            <Card.Body>
              <ol className="mb-0">
                <li className="mb-2">Admin registers voter with details</li>
                <li className="mb-2">Voter ID is hashed using SHA-256 for security</li>
                <li className="mb-2">Voter status is set to "Pending" initially</li>
                <li className="mb-2">Admin must approve the voter in the Voter List tab</li>
                <li className="mb-0">Once approved, voter can login with just their voter ID</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminVoterRegistration;