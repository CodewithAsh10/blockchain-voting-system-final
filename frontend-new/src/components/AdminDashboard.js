import React, { useState } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import ElectionManagement from './ElectionManagement';
import AdminResultsDashboard from './AdminResultsDashboard';
import BlockchainExplorer from './BlockchainExplorer';
import VoterList from './VoterList';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('elections');

  const renderContent = () => {
    switch(activeTab) {
      case 'elections':
        return <ElectionManagement />;
      case 'results':
        return <AdminResultsDashboard />;
      case 'blockchain':
        return <BlockchainExplorer />;
      case 'voters':
        return <VoterList />;
      default:
        return <ElectionManagement />;
    }
  };

  return (
    <div className="App">
      <Navbar expand="lg" className="navbar-custom" variant="dark">
        <Container>
          <Navbar.Brand href="#home">
            <i className="fas fa-shield-alt me-2"></i>
            Admin Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                active={activeTab === 'elections'} 
                onClick={() => setActiveTab('elections')}
                className="d-flex align-items-center"
              >
                <i className="fas fa-vote-yea me-1"></i>
                Elections
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 'voters'} 
                onClick={() => setActiveTab('voters')}
                className="d-flex align-items-center"
              >
                <i className="fas fa-users me-1"></i>
                Voters
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 'results'} 
                onClick={() => setActiveTab('results')}
                className="d-flex align-items-center"
              >
                <i className="fas fa-chart-pie me-1"></i>
                Results
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 'blockchain'} 
                onClick={() => setActiveTab('blockchain')}
                className="d-flex align-items-center"
              >
                <i className="fas fa-link me-1"></i>
                Blockchain
              </Nav.Link>
            </Nav>
            
            <Navbar.Text className="me-3">
              <i className="fas fa-user-shield me-1"></i>
              {user?.name || 'Admin'}
            </Navbar.Text>
            
            <Button 
              variant="outline-light" 
              size="sm" 
              className="me-2"
              onClick={onLogout}
            >
              <i className="fas fa-sign-out-alt me-1"></i>
              Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="my-4 flex-grow-1">
        {renderContent()}
      </Container>
    </div>
  );
};

export default AdminDashboard;