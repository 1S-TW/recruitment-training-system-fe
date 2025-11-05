import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email: email,
    password: password,
  });
  return response.data; // chứa token
};
