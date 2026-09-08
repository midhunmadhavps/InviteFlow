import AuthNavigator from "./src/navigation/AuthNavigator";
import { ToastProvider } from "./src/context/ToastContext";

export default function App() {
  return (
    <ToastProvider>
      <AuthNavigator />
    </ToastProvider>
  );
}