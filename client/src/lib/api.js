import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sa_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      err.userMessage =
        "Cannot reach the API. Make sure MongoDB is running, then from the project root run npm run dev (API on port 5000).";
    } else if (err.response.data?.message) {
      err.userMessage = err.response.data.message;
    }
    return Promise.reject(err);
  }
);

export default api;
