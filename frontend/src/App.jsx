import Spinner from "react-bootstrap/Spinner";
import { UserProvider } from "./context/UserProvider.jsx";
import { useUser } from "./context/useUser.js";
import BaseTemplate from "./pages/BaseTemplate.jsx";
import IndexPage from "./pages/IndexPage/IndexPage";

function AppContent() {
  const { isAuthenticated, isLoadingUser } = useUser();

  if (isLoadingUser) {
    return (
      <main className="startup-page">
        <div className="d-flex min-vh-100 align-items-center justify-content-center">
          <Spinner animation="border" role="status" variant="dark" />
        </div>
      </main>
    );
  }

  return isAuthenticated ? <BaseTemplate /> : <IndexPage />;
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
