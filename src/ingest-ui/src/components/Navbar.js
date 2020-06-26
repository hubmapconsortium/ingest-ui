import React from 'react';
import '../App.css';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';



const Navigation = (props) => {
    console.log(props);
    return (
         <Navbar bg="primary" variant="dark">
            <Navbar.Brand href="#home"><h3>HuBMAP Sample Registration and Data Collection</h3></Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                  <Nav.Link href="/Home" >Home</Nav.Link>
                     {/** <NavDropdown title = "Samples" id="nav-dropdown">
                        <NavDropdown.Item href="/Samples" eventKey="All">View Samples</NavDropdown.Item>
                        <NavDropdown.Item href="/Donor" eventKey="Donor">Create a Donor</NavDropdown.Item>
                        <NavDropdown.Item href="/Sample" eventKey="Sample">Create a Sample</NavDropdown.Item>
                    </NavDropdown>
                    <NavDropdown title = "Datasets" id="nav-dropdown">
                        <NavDropdown.Item href="/Datasets" eventKey="All">View Datasets</NavDropdown.Item>
                        <NavDropdown.Item href="/Dataset" eventKey="Donor">Create a Dataset</NavDropdown.Item>
                    </NavDropdown> */}
                    <Nav.Link href="/collections">Collections</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
}

export default withRouter(Navigation);