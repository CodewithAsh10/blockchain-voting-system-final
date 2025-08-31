import React, { useState, useEffect } from 'react';
import { Card, Accordion, Badge, Container, Spinner, Form, Alert, Row, Col } from 'react-bootstrap';

const BlockchainExplorer = () => {
  const [chain, setChain] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchChain(selectedElection);
      const interval = setInterval(() => fetchChain(selectedElection), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:5000/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
        if (data.length > 0) {
          setSelectedElection(data[0].election_id);
        }
      } else {
        setError('Failed to fetch elections');
      }
    } catch (error) {
      setError('Error connecting to server. Please make sure the backend is running on port 5000.');
      console.error('Error fetching elections:', error);
    }
  };

  const fetchChain = async (electionId) => {
    try {
      const response = await fetch(`http://localhost:5000/chain/${electionId}`);
      if (response.ok) {
        const data = await response.json();
        setChain(data.chain || []);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch blockchain data');
      }
      setLoading(false);
    } catch (error) {
      setError('Error connecting to server. Please make sure the backend is running on port 5000.');
      setLoading(false);
      console.error('Error fetching chain:', error);
    }
  };

  const formatHash = (hash) => {
    if (!hash || hash === '0') return hash;
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 6)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="text-center">
          <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <h5>Connection Error</h5>
          <p>{error}</p>
          <p className="text-muted small">
            Make sure your backend server is running: <code>python app.py</code>
          </p>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading blockchain data...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
        <i className="fas fa-link me-2"></i>
        Blockchain Explorer
      </h2>

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Election</Form.Label>
            <Form.Select 
              value={selectedElection} 
              onChange={(e) => setSelectedElection(e.target.value)}
              className="form-control-custom"
            >
              {elections.map((election, index) => (
                <option key={index} value={election.election_id}>
                  {election.name} ({election.status})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Card className="enhanced-card text-center">
            <Card.Body>
              <div className="stat-number">{chain.length}</div>
              <div className="stat-label">Total Blocks</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {selectedElection && (
        <Card className="enhanced-card mb-4">
          <Card.Header className="card-header-custom">
            <i className="fas fa-info-circle me-2"></i>
            Election Information
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Election ID:</strong> <code>{selectedElection}</code></p>
                <p><strong>Total Blocks:</strong> {chain.length}</p>
              </Col>
              <Col md={6}>
                <p><strong>Status:</strong> 
                  <Badge bg="info" className="ms-2">
                    {elections.find(e => e.election_id === selectedElection)?.status}
                  </Badge>
                </p>
                <p><strong>Total Transactions:</strong> 
                  {chain.reduce((total, block) => total + (block.transactions ? block.transactions.length : 0), 0)}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <div className="blockchain-accordion">
        <Accordion defaultActiveKey="0">
          {chain.map((block, index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <div>
                    <i className="fas fa-cube me-2"></i>
                    Block #{block.index}
                    {block.index === 0 && (
                      <Badge bg="warning" text="dark" className="ms-2">
                        Genesis Block
                      </Badge>
                    )}
                  </div>
                  <Badge bg="secondary">
                    {block.transactions ? block.transactions.length : 0} transactions
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Card className="enhanced-card">
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <p>
                          <strong>Block Hash:</strong><br />
                          <span className="hash-display d-block mt-1">
                            {formatHash(block.hash)}
                          </span>
                        </p>
                        <p>
                          <strong>Previous Hash:</strong><br />
                          <span className="hash-display d-block mt-1">
                            {formatHash(block.previous_hash)}
                          </span>
                        </p>
                      </Col>
                      <Col md={6}>
                        <p>
                          <strong>Timestamp:</strong><br />
                          <span className="d-block mt-1">
                            {formatTimestamp(block.timestamp)}
                          </span>
                        </p>
                        <p>
                          <strong>Nonce:</strong><br />
                          <code className="d-block mt-1">{block.nonce || 0}</code>
                        </p>
                      </Col>
                    </Row>
                    
                    <hr />
                    
                    <h6 className="mb-3">
                      <i className="fas fa-exchange-alt me-2"></i>
                      Transactions ({block.transactions ? block.transactions.length : 0})
                    </h6>
                    
                    {block.transactions && block.transactions.length > 0 ? (
                      <div className="mt-3">
                        {block.transactions.map((tx, txIndex) => (
                          <Card key={txIndex} className="mb-2 transaction-card">
                            <Card.Body className="p-3">
                              <Row>
                                <Col md={4}>
                                  <small className="text-muted d-block">Voter Hash</small>
                                  <span className="hash-display d-block">
                                    {formatHash(tx.voter_id)}
                                  </span>
                                </Col>
                                <Col md={3}>
                                  <small className="text-muted d-block">Candidate</small>
                                  <Badge bg="info" className="mt-1">
                                    {tx.candidate}
                                  </Badge>
                                </Col>
                                <Col md={3}>
                                  <small className="text-muted d-block">Election</small>
                                  <code>{tx.election_id}</code>
                                </Col>
                                <Col md={2}>
                                  <small className="text-muted d-block">Time</small>
                                  <span className="d-block">
                                    {formatTimestamp(tx.timestamp)}
                                  </span>
                                </Col>
                              </Row>
                              {tx.hash && (
                                <Row className="mt-2">
                                  <Col>
                                    <small className="text-muted d-block">Transaction Hash</small>
                                    <span className="hash-display d-block small">
                                      {formatHash(tx.hash)}
                                    </span>
                                  </Col>
                                </Row>
                              )}
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-inbox fa-2x mb-3 text-muted"></i>
                        <p className="text-muted mb-0">No transactions in this block</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>

      {chain.length === 0 && (
        <Card className="enhanced-card text-center py-5">
          <Card.Body>
            <i className="fas fa-inbox fa-3x mb-3" style={{ color: '#BDC3C7' }}></i>
            <h5 className="text-muted">No blocks in the chain yet</h5>
            <p className="text-muted">Blocks will appear here once votes are cast and mined.</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default BlockchainExplorer;