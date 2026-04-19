import { createHashRouter } from "react-router";
import App from "./App";
import { HomePage } from "./routes/Home";
import PasswordPage from "./routes/Password";
import { PasswordGeneratorPage } from "./routes/PasswordGenerator";
import { SearchPage } from "./routes/Search";
import OnboardPage from "./routes/Onboard";
import SettingsPage from "./routes/Settings";

export const router = createHashRouter([
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
      },
      {
        path: 'onboard',
        Component: OnboardPage,
      },
      {
        path: 'settings',
        Component: SettingsPage,
      }
    ]
  },
  {
    path: '/search',
    Component: SearchPage
  }
]);
