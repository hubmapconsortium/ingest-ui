import React from "react";

const Login = (props) => {
  const login_url = `${process.env.REACT_APP_BACKEND_URL}/login`;
  function cleanLogin(e){
    e.preventDefault();
    console.debug('%c◉ Purging storage... ', 'color:#00ff7b');
    props.purgeStorage();
    console.debug('%c◉ Goodbye! 👋', 'color:#00ff7b');
    window.location = `${process.env.REACT_APP_BACKEND_URL}/login`;
  }
  return (
    <div className="alert alert-info" role="alert">
      <h1>HuBMAP Data Ingest</h1>
        <p>User authentication is required to register donors, samples, tissues and datasets.  Please click the button below and you will be redirected to a login page. There you can login with your institutional credentials. Thank you!</p>
        <hr />
        <a className="btn btn-primary btn-lg" onClick={(e) => cleanLogin(e)} href={login_url} >
          Log in with your institutional credentials
        </a>
    </div>
  )
};

export default Login;
