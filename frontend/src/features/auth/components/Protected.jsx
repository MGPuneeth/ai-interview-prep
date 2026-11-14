import { useAuth } from "../hooks/useAuth.js";
import { Navigate } from "react-router";
import React, { Children } from "react";

const Protected = ({ children }) => {
  const { loading, user } = useAuth();
  // console.log(user);

  if (loading) {
    return (
      <main>
        <h1>LOADING...........</h1>
      </main>
    );
  }

  if (!user) {
    return <Navigate to={"/login"} />;
  }
  return children;
};

export default Protected;
