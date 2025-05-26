import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_HOST;

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

export default http;
