import axios from "axios";

export const http = axios.create({
  baseURL: "/",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response)
      console.error("API Error:", err.response.status, err.response.data);
    else console.error("API Error:", err.message);
    return Promise.reject(err);
  }
);
