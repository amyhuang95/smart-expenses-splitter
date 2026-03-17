import Spinner from "react-bootstrap/Spinner";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { UserProvider } from "./context/UserProvider.jsx";
import { useUser } from "./context/useUser.js";
import AppLayout from "./layouts/AppLayout.jsx";
import HomePage from "./pages/HomePage/HomePage.jsx";
import IndexPage from "./pages/IndexPage/IndexPage.jsx";

function AppRoutes() {
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

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/home" /> : <IndexPage />}
      />
      <Route
        element={isAuthenticated ? <AppLayout /> : <Navigate to="/" />}
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/groups" element={<HomePage />} />
        <Route path="/single-expenses" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
