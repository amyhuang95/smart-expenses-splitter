/**
 * This file defines a UserContext and a UserProvider component that manages user authentication state.
 * It provides functions for logging in, registering, and logging out users, as well as fetching the current user on initial load.
 * The useUser hook allows components to access the user context and its functions.
 */

import PropTypes from "prop-types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth.js";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoadingUser,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const nextUser = await loginUser(credentials);
        setUser(nextUser);
        return nextUser;
      },
      async register(payload) {
        const nextUser = await registerUser(payload);
        setUser(nextUser);
        return nextUser;
      },
      async logout() {
        await logoutUser();
        setUser(null);
      },
    }),
    [user, isLoadingUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider.");
  }

  return context;
}
