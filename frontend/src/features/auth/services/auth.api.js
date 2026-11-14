import axios from "axios";

// Connects frontend with backend

// Instance of axios to store general structure
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, //give access to handle cookies
});

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", { email, password });
    // console.log(response);

    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export async function logout() {
  try {
    const response = await api.get("/api/auth/logout");
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export async function getme() {
  try {
    const response = await api.get("/api/auth/get-me");
    // console.log(response.data);

    return response.data;
  } catch (error) {
    console.log(error);
  }
}
