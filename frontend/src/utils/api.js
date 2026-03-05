import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://aapada-rakshak.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error("[API] Error:", err.message);
    throw err;
  },
);

export const disasterAPI = {
  getAll: (filters = {}) => api.get("/disasters", { params: filters }),
  create: (data) => api.post("/disasters", data),
  delete: (id) => api.delete(`/disasters/${id}`),
};

export const shelterAPI = {
  getAll: (params = {}) => api.get("/shelters", { params }),
  create: (data) => api.post("/shelters", data),
};

export const volunteerAPI = {
  getAll: (params = {}) => api.get("/volunteers", { params }),
  register: (data) => api.post("/volunteers", data),
};

export const reliefAPI = {
  getPosts: () => api.get("/relief-posts"),
  createPost: (data) => api.post("/relief-posts", data),
};

export const mlAPI = {
  predictRisk: (data) => api.post("/predict-risk", data),
};

export const sosAPI = {
  send: (data) => api.post("/sos", data),
};

export const analyticsAPI = {
  get: () => api.get("/analytics"),
};

export const historyAPI = {
  get: () => api.get("/history"),
};

export const usersAPI = {
  getAll: () => api.get("/users"),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
