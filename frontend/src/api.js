/*import axios from "axios";

// Base URL for Injee tasks collection
const BASE_URL = "http://localhost:4125/tasks";

// CRUD operations
export const getTasks = (params = {}) => axios.get(BASE_URL, { params });
export const addTask = (task) => axios.post(BASE_URL, task);
export const updateTask = (id, task) => axios.put(`${BASE_URL}/${id}`, task);
export const deleteTask = (id) => axios.delete(`${BASE_URL}/${id}`);

// File upload (extra feature)
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${BASE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
*/
/*
import axios from "axios";

// Use the correct Injee collection endpoint
const BASE_URL = "http://localhost:4125/data/tasks"; // <--- important

// CRUD operations
export const getTasks = (params = {}) => axios.get(BASE_URL, { params });
export const addTask = (task) => axios.post(BASE_URL, task);
export const updateTask = (id, task) => axios.put(`${BASE_URL}/${id}`, task);
export const deleteTask = (id) => axios.delete(`${BASE_URL}/${id}`);

// File upload (extra feature)
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${BASE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
*/
import axios from "axios";

const BASE_URL = "http://localhost:4125/api/tasks";

export const getTasks = () => axios.get(BASE_URL);

export const addTask = (task) => axios.post(BASE_URL, task);

export const updateTask = (id, task) => axios.put(`${BASE_URL}/${id}`, task);

export const deleteTask = (id) => axios.delete(`${BASE_URL}/${id}`);
