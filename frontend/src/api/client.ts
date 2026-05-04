import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const raw = err.response?.data?.message || '用户名或密码错误';
      const msg = Array.isArray(raw) ? raw.join('；') : raw;
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      }
      message.error(msg);
      return Promise.reject(err);
    }
    const raw = err.response?.data?.message || '请求失败';
    const msg = Array.isArray(raw) ? raw.join('；') : raw;
    message.error(msg);
    return Promise.reject(err);
  },
);

export default api;
