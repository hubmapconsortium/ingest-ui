import 'bootstrap/dist/css/bootstrap.css';
import * as ReactDOM from "react-dom";
import {BrowserRouter} from "react-router-dom";
//import "./assets/App.css";
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from "./App";


ReactDOM.render(
  <BrowserRouter forceRefresh={true}>
      <App />
  </BrowserRouter>,
   document.getElementById("root")
);
// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
// // <Router>
//  //</Router>,



