# Copperx Payout Telegram Bot

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()  [![License](https://img.shields.io/badge/license-MIT-blue.svg)]()  This Telegram bot allows users to interact with the Copperx Payout API to manage their USDC stablecoin balance, send and receive funds, and view transaction history, all directly within Telegram.  It's built with TypeScript, Node.js, Telegraf, and uses Redis for session management.

## Table of Contents

*   [Features](#features)
*   [Prerequisites](#prerequisites)
*   [Installation](#installation)
*   [Configuration](#configuration)
*   [Usage](#usage)
*   [API Integration](#api-integration)
*   [Deposit Notifications (Pusher)](#deposit-notifications-pusher)
*   [Security Considerations](#security-considerations)
*   [Deployment (Render)](#deployment-render)
*   [Testing](#testing)
*   [Troubleshooting](#troubleshooting)
*   [Contributing](#contributing)
*   [License](#license)

## Features

*   **Authentication:** Secure user login using email and OTP (One-Time Password) via the Copperx API.
*   **Wallet Management:**
    *   View wallet balances across multiple supported networks (Solana, Ethereum, etc.).
    *   Set a default wallet for transactions.
*   **Fund Transfers:**
    *   Send USDC to email addresses.
    *   Send USDC to external wallet addresses.
    *   Withdraw USDC to bank accounts (Note: Bank withdrawal may be limited by minimum amounts.  See API documentation.)
    *   View transaction history (last 10 transactions).
*   **Deposit Notifications:** Real-time deposit notifications via Pusher.
*   **User-Friendly Interface:**
    *   Intuitive command structure (`/login`, `/balance`, `/send`, `/withdraw`, etc.).
    *   Interactive menus and inline keyboards for confirmations and selections.
    *   Clear error messages and feedback.
*   **Security:**
    *   Secure handling of API keys and tokens.
    *   Session management with Redis.
    *   Token expiration handling.
    *   Input validation and sanitization.
    *   Confirmation steps for transactions.
* **Dynamic Menus**
    *   Persistent Telegram menu, which shows different options depending on login status.
* **Extensibility**
    * Uses a handlers map for easier addition of commands.

## Prerequisites

*   **Node.js:** Version 16 or higher (LTS recommended).
*   **npm or pnpm:**  Package manager (either npm or pnpm can be used).
*   **Telegram Account:**  You'll need a Telegram account to create and test the bot.
*   **Telegram Bot Token:**  Obtain a bot token from `@BotFather` on Telegram.
*   **Copperx Account:** You need a Copperx account and access to their Payout API.
*   **Redis:**  A Redis instance (either locally installed or a cloud service like Redis Cloud).  A free Redis Cloud instance is sufficient for development and testing.
*   **Pusher Account:** A Pusher account with a Channels app created. You'll need the `app_id`, `key`, `secret`, and `cluster` from your Pusher app.
*   **GitHub Account:**  For version control and deployment to Render.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <your_repository_url>
    cd <your_repository_name>
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install  # Or: npm install
    ```

## Configuration

1.  **Environment Variables:** Create a `.env` file in the root directory of your project and add the following, replacing the placeholders with your actual values:

    ```
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
    COPPERX_API_BASE_URL=[https://income-api.copperx.io/api](https://income-api.copperx.io/api)
    VITE_PUSHER_KEY=YOUR_PUSHER_APP_KEY
    VITE_PUSHER_CLUSTER=YOUR_PUSHER_CLUSTER
    VITE_PUSER_APP_ID=YOUR_PUSHER_APP_ID
    VITE_PUSHER_SECRET=YOUR_PUSHER_SECRET
    LOGIN_RATE_LIMIT_WINDOW=60000  # Optional: milliseconds (default: 1 minute)
    LOGIN_RATE_LIMIT_MAX=5        # Optional: Max login attempts per window (default: 5)
    REDIS_HOST=<your_redis_host>
    REDIS_PORT=<your_redis_port>
    REDIS_PASSWORD=<your_redis_password>
    REDIS_URL=redis://:<your_redis_password>@<your_redis_host>:<your_redis_port>
    USE_WEBHOOKS=true
    RENDER_EXTERNAL_URL=<your_render_external_url>
    ```

    *   **`TELEGRAM_BOT_TOKEN`:** Your bot token from BotFather.
    *   **`COPPERX_API_BASE_URL`:** The base URL for the Copperx API.
    *   **`VITE_PUSHER_KEY`:** Your Pusher app key (from the "Keys" section of your Pusher app dashboard).
    *   **`VITE_PUSHER_CLUSTER`:** Your Pusher cluster (e.g., `mt1`).
    *   **`VITE_PUSHER_APP_ID`:** Your Pusher app ID (from the "Keys" section of your Pusher app dashboard).
    *   **`VITE_PUSHER_SECRET`:** Your Pusher app secret (from the "Keys" section of your Pusher app dashboard).
    *   **`REDIS_HOST`:**  Your Redis host.
    *   **`REDIS_PORT`:**  Your Redis port.
    *   **`REDIS_PASSWORD`:**  Your Redis password.
    *   **`REDIS_URL`:**  Your Redis connection string.  See the "Connecting to Redis" section below for details.
    *   **`LOGIN_RATE_LIMIT_WINDOW` (Optional):**  The time window (in milliseconds) for rate limiting login attempts.
    *   **`LOGIN_RATE_LIMIT_MAX` (Optional):** The maximum number of login attempts allowed within the window.
    *   **`USE_WEBHOOKS`:** True/false for enabling/disabling webhooks on Render.
    *   **`RENDER_EXTERNAL_URL`:** Your Render external URL.
    *   **Do not commit the `.env` file!**

2.  **Connecting to Redis:**

    *   **Local Redis:** If you have Redis installed locally, your `REDIS_URL` will typically be `redis://localhost:6379`.
    *   **Redis Cloud:**  If you're using Redis Cloud:
        *   Log in to your Redis Cloud account.
        *   Go to your database's configuration page.
        *   Find the "Public Endpoint" (it will look like `redis-xxxxx.yyyyy.cloud.redislabs.com:12345`).
        *   Find your "Password".
        *   Construct your `REDIS_URL` like this: `redis://:<your_password>@<your_hostname>:<your_port>`

3.  **TypeScript Configuration (`tsconfig.json`):**

    Ensure your `tsconfig.json` is correctly configured.  The provided `tsconfig.json` in the code examples should work, but double-check:

    *   `outDir` is set correctly (usually `dist`).
    *   `rootDir` is set correctly (usually `src`).
    *   `moduleResolution` is set to `node`.
    * `"exclude": ["node_modules"]` is present.

## Usage

1.  **Build the bot:**

    ```bash
    pnpm build  # Or: npm run build
    ```

2.  **Start the bot:**

    ```bash
    pnpm start  # Or: npm start
    ```

3.  **Interact with the bot on Telegram:**

    *   Find your bot in Telegram (using the username you chose when creating it with BotFather).
    *   Send the `/start` command.
    *   Follow the prompts to log in using your Copperx email and OTP.
    *   Use the provided commands (see below) to interact with your Copperx account.

**Available Commands:**

*   `/start` - Starts the bot and displays a welcome message with options.
*   `/help` - Displays a list of available commands.
*   `/login` - Initiates the login process using your Copperx email and OTP.
*   `/balance` - Displays your current wallet balances.
*   `/defaultwallet` - Displays your currently set default wallet.
*   `/changedefaultwallet` - Allows you to select a new default wallet.
*   `/send` - Starts the process of sending funds.  You'll be prompted to choose between sending to an email address or a wallet address.
*   `/sendemail` - Starts the send-to-email flow directly.
*   `/sendwallet` - Starts the send-to-wallet flow directly.
*   `/last10transactions` - Displays your last 10 transactions.
*   `/withdraw` - Starts the process of withdrawing funds to a bank account.
*   `/logout` - Logs you out of your Copperx account and clears your session.

## API Integration

This bot interacts with the Copperx Payout API.  The API documentation is available at: [https://income-api.copperx.io/api/doc](https://income-api.copperx.io/api/doc)

All API interactions are handled within the `src/api/index.ts` file.  This file contains functions for each of the required API endpoints:

*   `requestEmailOtp`: Requests an OTP for login.
*   `authenticateEmailOtp`: Authenticates the user with the OTP.
*   `getUserProfile`: Gets the user's profile information.
*   `getKycStatus`: Gets the user's KYC/KYB status.
*   `getWalletBalances`: Gets the user's wallet balances.
*   `getDefaultWallet`: Gets the user's default wallet.
*   `setDefaultWallet`: Sets the user's default wallet.
*   `sendToEmail`: Sends funds to an email address.
*   `sendToWallet`: Sends funds to a wallet address.
*   `withdrawToBank`: Withdraws funds to a bank account.
*   `authenticatePusher`: Authenticates with the Pusher notification service.
*   `isTokenExpired`: Checks if token has expired.

**Error Handling:**

API errors are handled using a custom `ApiError` class (defined in `src/utils/errorHandler.ts`) and a centralized `handleApiError` function (in `src/utils/errorHandler.ts`).  This ensures consistent error reporting to the user and detailed logging for debugging.

## Deposit Notifications (Pusher)

Real-time deposit notifications are implemented using Pusher Channels.  You'll need a Pusher account and a Channels app.

*   **Configuration:**  Your Pusher `key` and `cluster` must be set as environment variables (`VITE_PUSHER_KEY` and `VITE_PUSHER_CLUSTER`).
*   **Authentication:** The bot uses the `/api/notifications/auth` endpoint of the Copperx API to authenticate with Pusher.  This ensures that only authorized users receive notifications.
*   **Channel:** The bot subscribes to a private channel named `private-org-<organizationId>`, where `<organizationId>` is the user's organization ID obtained from the Copperx API.
*   **Cleanup:** Pusher subscriptions are automatically cleaned up when the user logs out or the bot restarts.

## Security Considerations

*   **Environment Variables:** Sensitive information (API keys, tokens, passwords) is stored in environment variables and *never* hardcoded in the code.  The `.env` file is included in `.gitignore` to prevent accidental commits.
*   **Session Management:** User sessions are managed using `telegraf-session-redis` and a Redis database. This provides persistent and secure session storage.  *Do not* use the in-memory session store in production.
*   **Token Expiration:** The bot checks for token expiration before making API calls and prompts the user to log in again if the token has expired.
*   **Rate Limiting:** Rate limiting is implemented (using `telegraf-ratelimit`, though this is currently disabled in the provided example) on the `/login` command to mitigate brute-force attacks.  *It is highly recommended to implement rate limiting.*
*   **Input Validation:**  Basic input validation is performed for email addresses, amounts, and wallet IDs.  More robust validation (especially for wallet addresses) should be added based on the specific requirements of the supported networks.
*   **Input Sanitization:** User-provided input is escaped using `escapeInput` before being included in Markdown messages to prevent Markdown injection vulnerabilities.
*   **Transaction Confirmations:** Inline keyboards are used to require explicit user confirmation before executing any send or withdraw operations.
*   **HTTPS:**  All communication with the Copperx API and Pusher is done over HTTPS.

## Deployment (Render)

This bot is designed to be deployed to Render.  Here are the steps:

1.  Create a new Web Service on Render.
2.  Connect your GitHub repository.
3.  Configure the service:
    *   **Name:** Choose a name.
    *   **Environment:** Node
    *   **Region:** Choose a region.
    *   **Build Command:** `npm install && npm run build` (or `pnpm install && pnpm build`)
    *   **Start Command:** `npm start` (or `pnpm start`)
    *   **Instance Type:** Starter (or Free, for initial testing)
    *   **Auto-Deploy:** Enable
4.  Set environment variables in the Render dashboard (see "Configuration" section above).
5.  Deploy.
6.  Set Webhook: set `USE_WEBHOOKS` to true, and redeploy.

## Testing

*   **Unit Tests:**  (Not included in the provided example, but highly recommended) Write unit tests for your API interaction functions, helper functions, and middleware.
*   **Integration Tests:**  Test the bot's core functionality (login, balance, send, withdraw, logout) end-to-end, using a real Telegram account and a test Copperx account.
*   **Error Handling:**  Test various error scenarios (invalid input, API errors, network errors) and ensure the bot handles them gracefully.
*   **Session Expiration:** Test token expiration.
*   **Rate Limiting:** Test the rate limiting functionality (if implemented).

## Troubleshooting

*   **"Bot is running..." not displayed:**  Check your `src/index.ts` file to ensure that `setupCommands()` is called *before* `bot.launch()`, and that `bot.launch()` is `await`-ed inside an `async` function. Check your `package.json` to ensure `start` points to the compiled output file.
*   **"Invalid bot token":**  Double-check your `TELEGRAM_BOT_TOKEN` environment variable.
*   **Pusher connection errors:** Verify your Pusher `key`, `cluster`, and `app_id` are set correctly in your environment variables.  Check the Pusher Debug Console for connection events. Make sure your server is sending the correct response for `/api/notifications/auth`.
*   **Redis connection errors:**  Verify your `REDIS_URL` is correct. Check your Redis Cloud dashboard to ensure your database is running.
*   **`[object Object]` errors:** Ensure you're extracting the correct message string from API responses and not passing entire objects to `ctx.reply`. Use the `handleApiError` function.
*   **Markdown parsing errors:**  Use `escapeInput` to escape any special Markdown characters in user input and dynamically generated messages. Use `replyWithMarkdownV2`.
*   **Session issues:**  Use `console.log(ctx.session)` to inspect the session data at various points in your code.
*  **Unhandled Promise Rejections:** Make sure *all* `async` functions are `await`-ed, and that you have `try...catch` blocks around *all* API calls and other asynchronous operations.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature/fix: `git checkout -b feature/your-feature`
3.  Make your changes and commit them with clear, descriptive messages.
4.  Write unit tests for your changes.
5.  Open a pull request against the `main` (or `master`) branch.

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.  (You should create a `LICENSE` file in your project root with the MIT license text, or choose a different license if appropriate).