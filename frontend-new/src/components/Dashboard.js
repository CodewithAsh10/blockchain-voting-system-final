import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Container } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminResultsDashboard = () => {
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/results');
      const data = await response.json();
      setResults(data);
      
      let total = 0;
      for (const candidate in data) {
        total += data[candidate];
      }
      setTotalVotes(total);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const chartData = {
    labels: Object.keys(results),
    datasets: [
      {
        label: 'Votes',
        data: Object.values(results),
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(41, 128, 185, 0.9)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#2C3E50',
          font: {
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Live Election Results - Admin View',
        color: '#2C3E50',
        font: {
          size: 18,
          weight: '600'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#7F8C8D'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#7F8C8D'
        }
      }
    }
  };

  return (
    <Container>
      <h2 className="mb-4 text-center" style={{ color: '#2C3E50', fontWeight: '700' }}>
        <i className="fas fa-chart-line me-2"></i>
        Election Results Dashboard
      </h2>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="enhanced-card h-100 text-center">
            <Card.Body className="admin-stats">
              <div className="admin-stat-number">{totalVotes}</div>
              <div className="admin-stat-label">Total Votes Cast</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="enhanced-card h-100 text-center">
            <Card.Body className="admin-stats">
              <div className="admin-stat-number">{Object.keys(results).length}</div>
              <div className="admin-stat-label">Candidates</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="enhanced-card h-100 text-center">
            <Card.Body className="admin-stats">
              <div className="admin-stat-number">
                {totalVotes > 0 ? Math.round((totalVotes / 1000) * 100) : 0}%
              </div>
              <div className="admin-stat-label">Voter Turnout</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="enhanced-card">
            <Card.Header className="card-header-custom">
              <i className="fas fa-chart-bar me-2"></i>
              Live Results Overview
            </Card.Header>
            <Card.Body>
              {Object.keys(results).length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x mb-3" style={{ color: '#BDC3C7' }}></i>
                  <p className="text-muted">No votes cast yet. The election will begin soon.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminResultsDashboard;