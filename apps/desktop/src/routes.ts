import { createBrowserRouter } from "react-router";
import { HomePage } from "./routes/Home";
import App from "./App";
import PasswordPage from "./routes/Password";
import { SearchPage } from "./routes/Search";
import { PasswordGeneratorPage } from "./routes/PasswordGenerator";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        index: true,
        Component: HomePage
      },
      {
        path: 'password',
        Component: PasswordPage
      },
      {
        path: 'generator',
        Component: PasswordGeneratorPage
      }
    ]
  },
  {
    path: '/search',
    Component: SearchPage
  }
]);