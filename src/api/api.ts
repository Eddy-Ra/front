import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 secondes car l'IA peut être lente
  headers: {
    "Content-Type": "application/json",
  },
});
