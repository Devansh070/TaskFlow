import axios from "axios";
import { clientId } from "../lib/clientId";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "X-Client-Id": clientId,
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);