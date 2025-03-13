// Copperx API interaction
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const baseURL = process.env.COPPERX_API_BASE_URL;

// --- Authentication ---
export async function requestEmailOtp(email: string) {
  try {
    const response = await axios.post(`${baseURL}/auth/email-otp/request`, { email });
    return response.data;
  } catch (error: any) {
    throw new Error(
      `API Error (requestEmailOtp): ${error.response?.data?.message || error.message}`,
    );
  }
}

export async function authenticateEmailOtp(email: string, otp: string) {
  try {
    const response = await axios.post(`${baseURL}/auth/email-otp/authenticate`, {
      email,
      otp,
    });
    return response.data; //This now returns the entire data
  } catch (error: any) {
    throw new Error(
      `API Error (authenticateEmailOtp): ${error.response?.data?.message || error.message}`,
    );
  }
}

export async function getUserProfile(token: string) {
  //Used later
  try {
    const response = await axios.get(`${baseURL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      `API Error (getUserProfile): ${error.response?.data?.message || error.message}`,
    );
  }
}
// --- KYC ---

export async function getKycStatus(token: string) {
  //Used later
  try {
    const response = await axios.get(`${baseURL}/kycs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      `API Error (getKycStatus): ${error.response?.data?.message || error.message}`,
    );
  }
}
