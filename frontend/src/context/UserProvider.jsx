import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth.js";
import UserContext from "./userContext.js";

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
          console.error("Failed to fetch current user", error.message);
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

  const value = {
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
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
