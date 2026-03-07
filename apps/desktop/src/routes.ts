import { createBrowserRouter } from "react-router";
import App from "./App";
import { HomePage } from "./routes/Home";
import PasswordPage from "./routes/Password";
import { PasswordGeneratorPage } from "./routes/PasswordGenerator";
import { SearchPage } from "./routes/Search";

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