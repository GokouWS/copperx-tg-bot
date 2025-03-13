// Copperx API interaction
import axios from "axios";
import dotenv from "dotenv";
import { createApiError } from "../utils/errorHandler";

dotenv.config();

const baseURL = process.env.COPPERX_API_BASE_URL;

// --- Authentication ---
export async function requestEmailOtp(email: string) {
  try {
    const response = await axios.post(`${baseURL}/auth/email-otp/request`, { email });
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

export async function authenticateEmailOtp(email: string, otp: string, sid: string) {
  try {
    const response = await axios.post(`${baseURL}/auth/email-otp/authenticate`, {
      email,
      otp,
      sid,
    });
    return response.data; //This now returns the entire data
  } catch (error) {
    throw createApiError(error);
  }
}

export async function getUserProfile(token: string) {
  //Used later
  try {
    const response = await axios.get(`${baseURL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw createApiError(error);
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
  } catch (error) {
    throw createApiError(error);
  }
}
