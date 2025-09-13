import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, InputGroup, Button, Row, Col, Alert, Modal } from 'react-bootstrap';

const VoterList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [voters, setVoters] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvedElections, setApprovedElections] = useState({});
  const [modalSelectedElection, setModalSelectedElection] = useState('');
  const [modalElections, setModalElections] = useState([]); // snapshot of elections while modal is open

  useEffect(() => {
    fetchVoters();
    fetchElections();
    // Removed interval to prevent flickering
    // const interval = setInterval(() => {
    //   fetchVoters();
    //   fetchElections();
    // }, 3000);
    // return () => clearInterval(interval);
  }, []);

  const fetchVoters = async () => {
    try {
      const response = await fetch('http://localhost:5000/voters');
      if (response.ok) {
        const data = await response.json();
        setVoters(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching voters:', error);
      setLoading(false);
    }
  };

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:5000/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
        // Don't automatically change selection - let user's choice persist
        // Only set initial selection if none exists and we have data
        if (!selectedElection && data.length > 0) {
          setSelectedElection(String(data[0].election_id));
        }
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const getApprovedElectionsForVoter = async (voterHash) => {
    try {
      // This would ideally come from a dedicated endpoint
      // For now, we'll check each election
      const approvedElectionsList = [];
      for (const election of elections) {
        const response = await fetch(`http://localhost:5000/elections`);
        if (response.ok) {
          const electionsData = await response.json();
          const currentElection = electionsData.find(e => e.election_id === election.election_id);
          if (currentElection && currentElection.approved_voters) {
            // This is a simplified check - in real implementation, you'd have a proper endpoint
            approvedElectionsList.push(String(election.election_id));
          }
        }
      }
      return approvedElectionsList;
    } catch (error) {
      console.error('Error fetching approved elections:', error);
      return [];
    }
  };

  const approveVoter = async (voterId, electionId) => {
    try {
      const response = await fetch('http://localhost:5000/approve_voter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voter_id: voterId,
          election_id: electionId,
          admin_key: 'admin123'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Voter approved for election: ${electionId}`);
        setVariant('success');
        fetchVoters();
        setShowApproveModal(false);
        setSelectedVoter(null);

        // Update approved elections for this voter
        setApprovedElections(prev => ({
          ...prev,
          [voterId]: [...(prev[voterId] || []), electionId]
        }));
      } else {
        setMessage(data.message);
        setVariant('danger');
      }
    } catch (error) {
      setMessage('Error approving voter. Please check if backend is running.');
      setVariant('danger');
    }
  };

  const openApproveModal = async (voter) => {
    setSelectedVoter(voter);
    setShowApproveModal(true);
    // take a stable snapshot of elections for the modal to prevent flicker while background refreshes
    setModalElections(elections.map(e => ({ ...e, election_id: String(e.election_id) })));
    // set initial modal selected election only once when opening (use string ids)
    setModalSelectedElection(String(elections[0]?.election_id) || '');
    // Fetch approved elections for this voter
    const approvedElectionsList = await getApprovedElectionsForVoter(voter.hashed_id);
    setApprovedElections(prev => ({
      ...prev,
      [voter.original_id]: approvedElectionsList
    }));
  };

  // Note: while modal is open we use modalElections (a snapshot) to render options
  const handleApprove = () => {
    if (selectedVoter && modalSelectedElection) {
      // find the original election id (could be number) from the live elections list if possible
      const liveMatch = elections.find(e => String(e.election_id) === modalSelectedElection);
      const electionIdToSend = liveMatch ? liveMatch.election_id : modalSelectedElection;
      approveVoter(selectedVoter.original_id, electionIdToSend);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'success',
      'Pending': 'warning',
      'Suspended': 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const isAlreadyApprovedForElection = (voterId, electionId) => {
    return approvedElections[voterId]?.includes(electionId);
  };

  const filteredVoters = voters.filter(voter => {
    const matchesSearch = voter.original_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.place.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || voter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 6)}`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading voter data...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
        <i className="fas fa-users me-2"></i>
        Voter Management
      </h2>

      {message && (
        <Alert variant={variant} className={variant === 'success' ? 'alert-custom-success' : 'alert-custom-danger'}>
          <i className={`fas ${variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
          {message}
        </Alert>
      )}

      <Card className="enhanced-card mb-4">
        <Card.Header className="card-header-custom">
          <i className="fas fa-filter me-2"></i>
          Filter Voters
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, name, email, or place..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-custom"
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control-custom select-custom"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending Approval</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="enhanced-card">
        <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
          <span>
            <i className="fas fa-list me-2"></i>
            Voter Records ({filteredVoters.length})
          </span>
          <Badge bg="primary">
            Total: {voters.length} voters
          </Badge>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover striped>
              <thead>
                <tr>
                  <th>Voter ID</th>
                  <th>Hashed ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Place</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Approved For</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoters.map((voter, index) => (
                  <tr key={index}>
                    <td><code>{voter.original_id}</code></td>
                    <td>
                      <span className="hash-display" title={voter.hashed_id}>
                        {formatHash(voter.hashed_id)}
                      </span>
                    </td>
                    <td>{voter.name}</td>
                    <td>{voter.email}</td>
                    <td>{voter.place}</td>
                    <td>{voter.age}</td>
                    <td>{getStatusBadge(voter.status)}</td>
                    <td>
                      <Badge bg="info" className="me-1">
                        {approvedElections[voter.original_id]?.length || 0} elections
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant={voter.status === 'Pending' ? "outline-success" : "outline-primary"}
                          size="sm"
                          title={voter.status === 'Pending' ? "Approve Voter" : "Manage Approvals"}
                          onClick={() => openApproveModal(voter)}
                        >
                          <i className={voter.status === 'Pending' ? "fas fa-check" : "fas fa-cog"}></i>
                          {voter.status === 'Pending' ? ' Approve' : ' Manage'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {filteredVoters.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No voters found</h5>
              <p className="text-muted">
                {voters.length === 0
                  ? "No voters have registered yet."
                  : "Try adjusting your search criteria"
                }
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={3}>
          <Card className="enhanced-card text-center">
            <Card.Body>
              <div className="stat-number">{voters.length}</div>
              <div className="stat-label">Total Voters</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="enhanced-card text-center">
            <Card.Body>
              <div className="stat-number text-warning">
                {voters.filter(v => v.status === 'Pending').length}
              </div>
              <div className="stat-label">Pending Approval</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="enhanced-card text-center">
            <Card.Body>
              <div className="stat-number text-success">
                {voters.filter(v => v.status === 'Active').length}
              </div>
              <div className="stat-label">Active Voters</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="enhanced-card text-center">
            <Card.Body>
              <div className="stat-number text-info">
                {Object.values(approvedElections).reduce((total, elections) => total + elections.length, 0)}
              </div>
              <div className="stat-label">Total Approvals</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Approve Voter Modal */}
      <Modal show={showApproveModal} onHide={() => {
        setShowApproveModal(false);
        setModalElections([]);
      }} size="lg">
        <Modal.Header closeButton className="card-header-custom">
          <Modal.Title>
            <i className="fas fa-user-check me-2"></i>
            {selectedVoter ? `Manage Voter: ${selectedVoter.name}` : 'Manage Voter'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVoter && (
            <>
              <div className="mb-3 p-3 border rounded">
                <Row>
                  <Col md={6}>
                    <p><strong>Voter ID:</strong> <code>{selectedVoter.original_id}</code></p>
                    <p><strong>Name:</strong> {selectedVoter.name}</p>
                    <p><strong>Email:</strong> {selectedVoter.email}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Status:</strong> {getStatusBadge(selectedVoter.status)}</p>
                    <p><strong>Approved For:</strong> {approvedElections[selectedVoter.original_id]?.length || 0} elections</p>
                  </Col>
                </Row>
              </div>

              <Form.Group className="mb-4">
                <Form.Label>Select Election to Approve For:</Form.Label>
                <Form.Select
                  value={modalSelectedElection}
                  onChange={(e) => setModalSelectedElection(e.target.value)}
                  className="form-control-custom"
                >
                  {(modalElections.length > 0 ? modalElections : elections.map(e => ({ ...e, election_id: String(e.election_id) }))).map((election, index) => (
                    <option key={index} value={String(election.election_id)}>
                      {election.name} ({election.status})
                      {isAlreadyApprovedForElection(selectedVoter.original_id, String(election.election_id)) && ' ✓'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  {isAlreadyApprovedForElection(selectedVoter.original_id, modalSelectedElection)
                    ? 'Voter is already approved for this election'
                    : 'Select which election this voter can participate in'
                  }
                </Form.Text>
              </Form.Group>

              {approvedElections[selectedVoter.original_id]?.length > 0 && (
                <div className="mt-3">
                  <h6>Currently Approved Elections:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {approvedElections[selectedVoter.original_id].map((electionId, index) => {
                      const lookup = (modalElections.length > 0 ? modalElections : elections.map(e => ({ ...e, election_id: String(e.election_id) })));
                      const election = lookup.find(e => String(e.election_id) === String(electionId));
                      return (
                        <Badge key={index} bg="success" className="me-1">
                          {election ? election.name : electionId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Close
          </Button>
          <Button
            className="btn-custom-primary"
            onClick={handleApprove}
            disabled={!modalSelectedElection || isAlreadyApprovedForElection(selectedVoter?.original_id, modalSelectedElection)}
          >
            <i className="fas fa-check me-2"></i>
            {isAlreadyApprovedForElection(selectedVoter?.original_id, modalSelectedElection)
              ? 'Already Approved'
              : 'Approve for Election'
            }
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VoterList;