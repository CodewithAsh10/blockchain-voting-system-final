import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Container, Form, Alert } from 'react-bootstrap';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminResultsDashboard = () => {
  const [results, setResults] = useState({});
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
    // Removed interval to prevent flickering
    // const interval = setInterval(fetchElections, 3000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchResults(selectedElection);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:5000/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
        // Only set initial selection if none exists and we have data
        if (!selectedElection && data.length > 0) {
          setSelectedElection(data[0].election_id);
        }
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
    setLoading(false);
  };

  const fetchResults = async (electionId) => {
    try {
      const response = await fetch(`http://localhost:5000/results/${electionId}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const selectedElectionData = elections.find(e => e.election_id === selectedElection);
  const totalVotes = Object.values(results).reduce((sum, votes) => sum + votes, 0);
  const votedPercentage = selectedElectionData && selectedElectionData.voter_count > 0
    ? ((totalVotes / selectedElectionData.voter_count) * 100).toFixed(1)
    : 0;

  const leadingCandidate = Object.keys(results).length > 0
    ? Object.entries(results).reduce((leading, [candidate, votes]) =>
      votes > (results[leading] || 0) ? candidate : leading, Object.keys(results)[0])
    : 'No votes yet';

  const chartData = {
    labels: Object.keys(results),
    datasets: [
      {
        data: Object.values(results),
        backgroundColor: [
          '#3498DB', '#E74C3C', '#27AE60', '#F39C12',
          '#9B59B6', '#34495E', '#16A085', '#D35400'
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading election results...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
        <i className="fas fa-chart-pie me-2"></i>
        Election Results
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
      </Row>

      {selectedElectionData && (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="enhanced-card text-center">
                <Card.Body>
                  <div className="stat-number">{totalVotes}</div>
                  <div className="stat-label">Total Votes</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="enhanced-card text-center">
                <Card.Body>
                  <div className="stat-number">{selectedElectionData.voter_count}</div>
                  <div className="stat-label">Eligible Voters</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="enhanced-card text-center">
                <Card.Body>
                  <div className="stat-number">{votedPercentage}%</div>
                  <div className="stat-label">Voter Turnout</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="enhanced-card text-center">
                <Card.Body>
                  <div className="stat-number" style={{ fontSize: '1.5rem' }}>
                    {leadingCandidate}
                  </div>
                  <div className="stat-label">Leading Candidate</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="enhanced-card mb-4">
                <Card.Header className="card-header-custom">
                  <i className="fas fa-chart-pie me-2"></i>
                  Vote Distribution - {selectedElectionData.name}
                </Card.Header>
                <Card.Body className="text-center">
                  {Object.keys(results).length > 0 ? (
                    <div style={{ height: '300px' }}>
                      <Doughnut data={chartData} options={chartOptions} />
                    </div>
                  ) : (
                    <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      No votes cast in this election yet.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="enhanced-card">
                <Card.Header className="card-header-custom">
                  <i className="fas fa-info-circle me-2"></i>
                  Election Details
                </Card.Header>
                <Card.Body>
                  <p><strong>Election ID:</strong> <code>{selectedElectionData.election_id}</code></p>
                  <p><strong>Status:</strong> <span className="text-capitalize">{selectedElectionData.status}</span></p>
                  <p><strong>Candidates:</strong> {selectedElectionData.candidates.join(', ')}</p>
                  <p><strong>Total Votes:</strong> {totalVotes}</p>
                  <p><strong>Voter Turnout:</strong> {votedPercentage}%</p>
                  {leadingCandidate !== 'No votes yet' && (
                    <p><strong>Leading Candidate:</strong> {leadingCandidate} ({results[leadingCandidate]} votes)</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default AdminResultsDashboard;