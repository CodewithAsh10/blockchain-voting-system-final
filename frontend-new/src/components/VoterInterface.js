import React, { useState, useEffect } from 'react';
import { Navbar, Container, Button, Form, Card, Alert, Row, Col, Badge } from 'react-bootstrap';

const VoterInterface = ({ user, onLogout }) => {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedElection, setSelectedElection] = useState('');
  const [elections, setElections] = useState([]);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('');
  const [loading, setLoading] = useState(false);
  const [voterInfo, setVoterInfo] = useState(null);

  useEffect(() => {
    fetchElections();
    fetchVoterInfo();
    const interval = setInterval(fetchElections, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

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

  const fetchVoterInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/voters');
      if (response.ok) {
        const voters = await response.json();
        const currentVoter = voters.find(v => v.original_id === user.id);
        setVoterInfo(currentVoter);
      }
    } catch (error) {
      console.error('Error fetching voter information:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!selectedCandidate || !selectedElection) {
      setMessage('Please select both election and candidate');
      setVariant('danger');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voter_id: user.id,
          candidate: selectedCandidate,
          election_id: selectedElection,
          timestamp: Date.now() / 1000
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Vote cast successfully! Your vote has been recorded on the blockchain.');
        setVariant('success');
        setSelectedCandidate('');
        setSelectedElection('');
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

  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'success',
      'Pending': 'warning',
      'Suspended': 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const activeElections = elections.filter(e => e.status === 'active');

  return (
    <div className="App">
      <Navbar expand="lg" className="navbar-custom" variant="dark">
        <Container>
          <Navbar.Brand href="#home">
            <i className="fas fa-vote-yea me-2"></i>
            Voter Portal
          </Navbar.Brand>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={onLogout}
          >
            <i className="fas fa-sign-out-alt me-1"></i>
            Logout
          </Button>
        </Container>
      </Navbar>

      <Container className="my-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
              <i className="fas fa-ballot me-2"></i>
              Cast Your Vote
            </h2>

            <Card className="enhanced-card mb-4">
              <Card.Header className="card-header-custom">
                <i className="fas fa-user me-2"></i>
                Voter Information
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Name:</strong> {voterInfo?.name || 'Not provided'}</p>
                    <p><strong>Voter ID:</strong> <code>{user.id}</code></p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Email:</strong> {voterInfo?.email || 'Not provided'}</p>
                    <p><strong>Status:</strong> 
                      {voterInfo ? getStatusBadge(voterInfo.status) : <Badge bg="secondary">Unknown</Badge>}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {message && (
              <Alert variant={variant} className={variant === 'success' ? 'alert-custom-success' : 'alert-custom-danger'}>
                <i className={`fas ${variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                {message}
              </Alert>
            )}

            <Card className="enhanced-card">
              <Card.Header className="card-header-custom">
                <i className="fas fa-pencil-alt me-2"></i>
                Voting Form
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">
                      <i className="fas fa-vote-yea me-2"></i>
                      Select Election
                    </Form.Label>
                    <Form.Select 
                      value={selectedElection} 
                      onChange={(e) => setSelectedElection(e.target.value)}
                      className="form-control-custom select-custom"
                      disabled={loading}
                    >
                      <option value="">Choose an election</option>
                      {activeElections.map((election, index) => (
                        <option key={index} value={election.election_id}>
                          {election.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {activeElections.length === 0 
                        ? 'No active elections available'
                        : 'Select the election you want to vote in'
                      }
                    </Form.Text>
                  </Form.Group>

                  {selectedElection && (
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">
                        <i className="fas fa-user-tie me-2"></i>
                        Select Candidate
                      </Form.Label>
                      <Form.Select 
                        value={selectedCandidate} 
                        onChange={(e) => setSelectedCandidate(e.target.value)}
                        className="form-control-custom select-custom"
                        disabled={loading}
                      >
                        <option value="">Choose a candidate</option>
                        {elections
                          .find(e => e.election_id === selectedElection)
                          ?.candidates.map((candidate, index) => (
                            <option key={index} value={candidate}>
                              {candidate}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  )}

                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      className="btn-custom-primary"
                      disabled={loading || !selectedCandidate || !selectedElection}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing Vote...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Cast Your Vote
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
                Active Elections
              </Card.Header>
              <Card.Body>
                {activeElections.length > 0 ? (
                  activeElections.map((election, index) => (
                    <div key={index} className="mb-3 p-3 border rounded">
                      <h6>{election.name}</h6>
                      <p className="mb-1 small">
                        <strong>Candidates:</strong> {election.candidates.join(', ')}
                      </p>
                      <p className="mb-0 small text-muted">
                        Election ID: <code>{election.election_id}</code>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">No active elections at the moment</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default VoterInterface;