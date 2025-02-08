import axios from "axios";
import { BASE_API_URL } from "../config/apiConfig";

export const fetchMessage = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/`);
    return response.data.message;
  } catch (error) {
    console.error("Error fetching API:", error);
    return null;
  }
};
