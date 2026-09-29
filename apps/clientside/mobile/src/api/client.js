import axios from "axios";
import { getToken } from "../utils/auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;