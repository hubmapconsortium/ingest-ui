import { createRoot } from "react-dom/client";
import {BrowserRouter} from "react-router";
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {prepareVersionedStorage} from "./utils/version_storage";
import {installDevToolHotkeys} from "./utils/dev_tool_manager";

async function startApp() {
  if (!prepareVersionedStorage()) return;

  installDevToolHotkeys();
  const {default: App} = await import("./App");
  const root = createRoot(document.getElementById("root"));

  root.render(
    <BrowserRouter forceRefresh={true}>
      <App />
    </BrowserRouter>
  );
}

startApp();
// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
// // <Router>
//  //</Router>,
