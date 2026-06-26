import { createRoot } from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
//import "./assets/App.css";
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from "./App";


const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter forceRefresh={true}>
      <App />
  </BrowserRouter>
);
// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
// // <Router>
//  //</Router>,
