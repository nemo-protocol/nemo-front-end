import axios from 'axios';


const baseURL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_HOST         
    : process.env.NEXT_PUBLIC_HOST;     

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

export default http;
