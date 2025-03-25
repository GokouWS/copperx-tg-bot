// Copperx API interaction
import axios from "axios";
import dotenv from "dotenv";
import { createApiError } from "../utils/errorHandler";
import { pusher } from "../bot";

dotenv.config();

const baseURL = process.env.COPPERX_API_BASE_URL;

// --- Authentication ---

/**
 * Requests an OTP for the given email address.
 *
 * @param {string} email - the email address to request an OTP for
 * @returns {Promise<RequestEmailOtpResponse>} - the API response
 * @throws {ApiError} - if the API request fails
 */
export async function requestEmailOtp(email: string) {
  try {
    const response = await axios.post(`${baseURL}/auth/email-otp/request`, { email });
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

/**
 * Authenticates an email address using the given OTP and session ID.
 *
 * @param {string} email - the email address to authenticate
 * @param {string} otp - the OTP to use for authentication
 * @param {string} sid - the session ID used to tie the OTP to the user
 * @returns {Promise<AuthenticateEmailOtpResponse>} - the API response
 * @throws {ApiError} - if the API request fails
 */
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

/**
 * Logs out a user with the given token.
 *
 * @param {string} token - the JWT token to use for logging out
 * @returns {Promise<LogoutResponse>} - the API response
 * @throws {ApiError} - if the API request fails
 */
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

/**
 * Retrieves the user profile associated with the given token.
 *
 * Makes an API request to fetch the user's profile information
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @returns {Promise<any>} - The API response containing user profile data.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Retrieves the KYC status associated with the given token.
 *
 * Makes an API request to fetch the user's KYC status
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @returns {Promise<KycStatus>} - The API response containing KYC status data.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Retrieves a list of wallets associated with the given token,
 * along with their respective balances.
 *
 * Makes an API request to fetch the user's wallets and balances
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @returns {Promise<WalletsResponse>} - The API response containing a list of wallets and balances.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Retrieves the user's default wallet.
 *
 * Makes an API request to fetch the user's default wallet
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @returns {Promise<Wallet>} - The API response containing the default wallet.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Sets the user's default wallet to the given wallet ID.
 *
 * Makes an API request to set the user's default wallet
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @param {string} walletId - The ID of the wallet to set as the default.
 * @returns {Promise<Wallet>} - The API response containing the default wallet.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Sends funds to an email address using the provided JWT token for authentication.
 *
 * Makes an API request to send funds to the given email address
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @param {string} email - The email address to send funds to.
 * @param {string} amount - The amount of funds to send.
 * @param {string} currency - The currency to send funds in.
 * @param {string} purposeCode - The purpose code to use for the transfer.
 * @returns {Promise<Transfer>} - The API response containing the transfer.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Sends funds to a wallet address using the provided JWT token for authentication.
 *
 * Makes an API request to send funds to the given wallet address
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @param {string} walletAddress - The wallet address to send funds to.
 * @param {string} amount - The amount of funds to send.
 * @param {string} currency - The currency to send funds in.
 * @param {string} purposeCode - The purpose code to use for the transfer.
 * @returns {Promise<Transfer>} - The API response containing the transfer.
 * @throws {ApiError} - If the API request fails.
 */
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

/**
 * Retrieves the last 10 transactions associated with the given token.
 *
 * Makes an API request to fetch the user's most recent transactions,
 * limited to 10, using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @returns {Promise<any>} - The API response containing transaction data.
 * @throws {ApiError} - If the API request fails.
 */

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

/**
 * Retrieves the balance of the user's wallet using the provided JWT token.
 *
 * Makes an API request to fetch the user's wallet balance,
 * using the provided JWT token for authentication.
 *
 * @param {string} token - The JWT token used for authentication.
 * @returns {Promise<any>} - The API response containing the wallet balance.
 * @throws {ApiError} - If the API request fails.
 */

export async function getWalletBalance(token: string) {
  try {
    const response = await axios.get(`${baseURL}/wallets/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
}

// amount: string;
// currency: string;
// destinationCountry: string;
// onlyRemittance: boolean;
// preferredBankAccountId: string;
// sourceCountry: string;
export async function getBankAccount(token: string) {
  const amount = "1";
  const currency = "USD";
  const destinationCountry = "US";
  const onlyRemittance = true;
  const preferredBankAccountId = "";
  const sourceCountry = "none";
  try {
    const response = await axios.post(
      `${baseURL}/quotes/offramp`,
      {
        amount,
        currency,
        destinationCountry,
        onlyRemittance,
        preferredBankAccountId,
        sourceCountry,
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

/**
 * Authenticates with the Pusher notification service using the provided token, socket ID, and channel name.
 *
 * Sends a request to the Copperx API's notification authentication endpoint to authenticate the Pusher connection.
 *
 * @param {string} token - The JWT token used for authentication.
 * @param {string} socketId - The socket ID associated with the Pusher connection.
 * @param {string} channelName - The name of the Pusher channel to authenticate.
 * @returns {Promise<any>} - The API response containing the authentication data.
 * @throws {ApiError} - If the API request fails.
 */
export async function authenticatePusher(
  token: string,
  socketId: string,
  channelName: string,
) {
  // console.log("Authenticating Pusher...");
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
    // console.log("Pusher auth response:", response);
    return response.data;

    const socketData = await pusher.authenticate(socketId, channelName);

    // console.log("Pusher auth response:", socketData);
    return socketData; // This now returns the correct auth data
  } catch (error) {
    throw createApiError(error);
  }
}

// Token Expiration check

/**
 * Checks if the token is expired based on its expiration timestamp.
 *
 * @param {any} tokenData - The token data which includes the expiration timestamp.
 * @returns {boolean} - Returns true if the token is expired or if token data is missing/invalid; otherwise, false.
 */

export function isTokenExpired(tokenData: any): boolean {
  if (!tokenData || !tokenData.expireAt) {
    return true; // Assume expired if no data
  }
  // Compare expiresAt (which should be a UNIX timestamp in milliseconds) with the current time.
  return tokenData.expiresAt <= Date.now();
}
