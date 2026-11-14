import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout, getme } from "../services/auth.api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);

  const { user, setUser, loading, setLoading } = context;

  const handleLogin = async ({ email, password }) => {
    setLoading(true);

    // API Call
    try {
      const data = await login({ email, password });
      // console.log(data);
      setUser(data.user);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);

    // API Call
    const data = await register(username, email, password);
    setUser(data.user);
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);

    // API Call
    const data = await logout(username, email, password);
    setUser(null);
    setLoading(false);
  };

  const handleGetMe = async ({ username, email, password }) => {
    setLoading(true);

    // API Call
    const data = await register(username, email, password);
    setUser(data.user);
    setLoading(false);
  };

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const data = await getme();
        // console.log(data.user);
        setUser(data.user);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    getAndSetUser();
  });

  return { handleLogin, handleRegister, handleLogout, user, loading };
};
