import axios from "axios";

export default axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // ex.: http://localhost:8080
  withCredentials: true, // envia e recebe cookie
});
