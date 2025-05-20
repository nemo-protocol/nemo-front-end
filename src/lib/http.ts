import axios from 'axios';


const baseURL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL         
    : process.env.NEXT_PUBLIC_API_URL;     

console.log(process.env.NEXT_PUBLIC_API_URL,1111)
export const http = axios.create({
  baseURL,
  timeout: 10000,
});

export default http;
