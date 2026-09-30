import axios from "axios";
import { getAdminToken, removeAdminToken, removeAdminUser } from "../utils/auth";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth failures
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (error.response.status === 401) {
        await removeAdminToken();
        await removeAdminUser();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
