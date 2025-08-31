import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge, Modal } from 'react-bootstrap';

const ElectionManagement = () => {
  const [elections, setElections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newElection, setNewElection] = useState({
    election_id: '',
    name: '',
    candidates: '',
    duration_hours: 24
  });
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchElections();
    const interval = setInterval(fetchElections, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:5000/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/create_election', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newElection,
          candidates: newElection.candidates.split(',').map(c => c.trim()),
          admin_key: 'admin123'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Election created successfully!');
        setVariant('success');
        setShowCreateModal(false);
        setNewElection({ election_id: '', name: '', candidates: '', duration_hours: 24 });
        fetchElections();
      } else {
        setMessage(data.message);
        setVariant('danger');
      }
    } catch (error) {
      setMessage('Error connecting to server');
      setVariant('danger');
    }
    setLoading(false);
  };

  const manageElection = async (electionId, action) => {
    try {
      const response = await fetch('http://localhost:5000/manage_election', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          election_id: electionId,
          action: action,
          admin_key: 'admin123'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Election ${action}ed successfully!`);
        setVariant('success');
        fetchElections();
      } else {
        setMessage(data.message);
        setVariant('danger');
      }
    } catch (error) {
      setMessage('Error connecting to server');
      setVariant('danger');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'active': 'success',
      'upcoming': 'warning',
      'completed': 'info',
      'suspended': 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ color: '#2C3E50', fontWeight: '700' }}>
          <i className="fas fa-vote-yea me-2"></i>
          Election Management
        </h2>
        <Button 
          className="btn-custom-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Create Election
        </Button>
      </div>

      {message && (
        <Alert variant={variant} className={variant === 'success' ? 'alert-custom-success' : 'alert-custom-danger'}>
          <i className={`fas ${variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
          {message}
        </Alert>
      )}

      <Row>
        <Col>
          <Card className="enhanced-card">
            <Card.Header className="card-header-custom">
              <i className="fas fa-list me-2"></i>
              Active Elections ({elections.filter(e => e.status === 'active').length})
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Election ID</th>
                      <th>Name</th>
                      <th>Candidates</th>
                      <th>Duration</th>
                      <th>Voters</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elections.filter(e => e.status === 'active').map((election, index) => (
                      <tr key={index}>
                        <td><code>{election.election_id}</code></td>
                        <td>{election.name}</td>
                        <td>
                          <Badge bg="secondary" className="me-1">
                            {election.candidates.length} candidates
                          </Badge>
                        </td>
                        <td>{(election.end_time - election.start_time) / 3600}h</td>
                        <td>{election.voter_count}</td>
                        <td>{getStatusBadge(election.status)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => manageElection(election.election_id, 'suspend')}
                            >
                              <i className="fas fa-pause"></i> Suspend
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => manageElection(election.election_id, 'stop')}
                            >
                              <i className="fas fa-stop"></i> Stop
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {elections.filter(e => e.status === 'active').length === 0 && (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No active elections</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card className="enhanced-card">
            <Card.Header className="card-header-custom">
              <i className="fas fa-clock me-2"></i>
              Upcoming Elections
            </Card.Header>
            <Card.Body>
              {elections.filter(e => e.status === 'upcoming').map((election, index) => (
                <div key={index} className="mb-3 p-3 border rounded">
                  <h6>{election.name}</h6>
                  <p className="mb-1"><small>Starts: {formatTime(election.start_time)}</small></p>
                  <p className="mb-2"><small>Duration: {(election.end_time - election.start_time) / 3600} hours</small></p>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => manageElection(election.election_id, 'start')}
                  >
                    <i className="fas fa-play me-1"></i> Start Now
                  </Button>
                </div>
              ))}
              {elections.filter(e => e.status === 'upcoming').length === 0 && (
                <p className="text-muted text-center">No upcoming elections</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="enhanced-card">
            <Card.Header className="card-header-custom">
              <i className="fas fa-history me-2"></i>
              Completed Elections
            </Card.Header>
            <Card.Body>
              {elections.filter(e => e.status === 'completed').slice(0, 3).map((election, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <p className="mb-0 small">{election.name}</p>
                  <small className="text-muted">Ended: {formatTime(election.end_time)}</small>
                </div>
              ))}
              {elections.filter(e => e.status === 'completed').length === 0 && (
                <p className="text-muted text-center">No completed elections</p>
              )}
            </Card.Body>
          </Card>

          <Card className="enhanced-card mt-4">
            <Card.Header className="card-header-custom">
              <i className="fas fa-ban me-2"></i>
              Suspended Elections
            </Card.Header>
            <Card.Body>
              {elections.filter(e => e.status === 'suspended').map((election, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <p className="mb-0 small">{election.name}</p>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => manageElection(election.election_id, 'resume')}
                  >
                    <i className="fas fa-play me-1"></i> Resume
                  </Button>
                </div>
              ))}
              {elections.filter(e => e.status === 'suspended').length === 0 && (
                <p className="text-muted text-center">No suspended elections</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Election Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton className="card-header-custom">
          <Modal.Title>
            <i className="fas fa-plus me-2"></i>
            Create New Election
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateElection}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Election ID *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="election-2024"
                    value={newElection.election_id}
                    onChange={(e) => setNewElection({...newElection, election_id: e.target.value})}
                    required
                  />
                  <Form.Text className="text-muted">Unique identifier for the election</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Election Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Presidential Election 2024"
                    value={newElection.name}
                    onChange={(e) => setNewElection({...newElection, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Candidates *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Candidate A, Candidate B, Candidate C"
                value={newElection.candidates}
                onChange={(e) => setNewElection({...newElection, candidates: e.target.value})}
                required
              />
              <Form.Text className="text-muted">Separate candidate names with commas</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (hours) *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="720"
                value={newElection.duration_hours}
                onChange={(e) => setNewElection({...newElection, duration_hours: parseInt(e.target.value)})}
                required
              />
              <Form.Text className="text-muted">How long the election should run</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-custom-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Election'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ElectionManagement;