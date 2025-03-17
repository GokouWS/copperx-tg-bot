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

export async function logout(token: string) {
  //Used later
  try {
    const response = await axios.get(`${baseURL}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
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

// --- Wallet ---

export async function getWalletBalances(token: string) {
  try {
    const response = await axios.get(`${baseURL}/wallets/balances`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

export async function getDefaultWallet(token: string) {
  try {
    const response = await axios.get(`${baseURL}/wallets/default`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

export async function setDefaultWallet(token: string, walletId: string) {
  try {
    const response = await axios.post(
      `${baseURL}/wallets/default`,
      { walletId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

// --- Transfers ---

export async function sendToEmail(
  token: string,
  email: string,
  amount: string,
  currency: string,
  purposeCode: string,
) {
  try {
    const response = await axios.post(
      `${baseURL}/transfers/send`,
      {
        email,
        amount,
        currency,
        purposeCode,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

export async function sendToWallet(
  token: string,
  walletAddress: string,
  amount: string,
  currency: string,
  purposeCode: string,
) {
  try {
    const response = await axios.post(
      `${baseURL}/transfers/wallet-withdraw`,
      {
        walletAddress,
        amount,
        currency,
        purposeCode,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

export async function getLast10Transactions(token: string) {
  try {
    const response = await axios.get(`${baseURL}/transfers?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

// --- Withdraw ---
export async function withdrawToBank(
  token: string,
  bankAccountId: string,
  amount: string,
  currency: string,
) {
  try {
    const response = await axios.post(
      `${baseURL}/transfers/offramp`,
      {
        bankAccountId,
        amount,
        currency,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error: any) {
    throw createApiError(error);
  }
}

// --- Pusher ---
export async function authenticatePusher(
  token: string,
  socketId: string,
  channelName: string,
) {
  console.log("Authenticating Pusher...");
  try {
    console.log("Sending Pusher auth request...");
    const response = await axios.post(
      `${baseURL}/notifications/auth`,
      {
        socket_id: socketId,
        channel_name: channelName,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

// Token Expiration check
export function isTokenExpired(tokenData: any): boolean {
  if (!tokenData || !tokenData.expireAt) {
    return true; // Assume expired if no data
  }
  // Compare expiresAt (which should be a UNIX timestamp in milliseconds) with the current time.
  return tokenData.expiresAt <= Date.now();
}
