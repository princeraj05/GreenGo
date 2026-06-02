import axios from "axios";
import { getApiUrl } from "../utils/getApiUrl";

const API = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // agar auth use kar rahe ho
});

export default API;