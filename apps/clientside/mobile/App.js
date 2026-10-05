import AuthNavigator from "./src/navigation/AuthNavigator";
import { ToastProvider } from "./src/context/ToastContext";
import { ThemeProvider } from "../web/src/shared/theme/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthNavigator />
      </ToastProvider>
    </ThemeProvider>
  );
}