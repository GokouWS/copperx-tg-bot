# Copperx Telegram Bot

This is a Telegram bot designed to interact with the Copperx platform.  It allows users to perform actions such as checking balances, sending and receiving funds, and managing their Copperx account, all within Telegram.

## Project Structure

The project is organized as follows:


```
copperx-telegram-bot/
├── node_modules/                 # (Automatically created by pnpm - DO NOT TRACK)
├── src/                          # Source code for the bot
│   ├── api/                      # Copperx API interaction
│   │   └── index.ts              # Logic for interacting with the Copperx API.
│   ├── commands/                 # Telegram bot commands
│   │   ├── balance.ts            # Handles /balance and related commands (e.g., sub-commands, variations).
│   │   ├── login.ts              # Handles /login command.
│   │   ├── logout.ts             # Handles /logout command.
│   │   ├── send.ts               # Handles /send command for sending funds.
│   │   ├── start.ts              # Handles /start command for starting bot.
│   │   ├── withdraw.ts           # Handles /withdraw command for withdrawing to bank.
│   │   └── index.ts              # Combines and exports all command modules for easy access.
│   ├── events/                   # Event handlers (besides commands)
│   │   └── deposit.ts            # Handles deposit notification events.
│   ├── utils/                    # Utility functions and middleware
│   │   ├── errorHandler.ts       # Error handling functions for handling function and API errors.
│   │   ├── helpers.ts            # Utility functions (e.g., currency formatting, data validation).
│   │   ├── menu.ts               # Reusable menu for chat replies.
│   │   └── middleware.ts         # Authentication middleware to protect commands.
│   ├── index.ts                  # Main bot entry point.
│   ├── bot.ts                    # Bot setup, initialization, and connection to Telegram.
│   └── types.ts                  # Type definitions.
├── .env                          # Environment variables (API keys, bot token, etc. - KEEP THIS SECRET!)
├── package.json                  # Project dependencies, scripts, and metadata.
├── tsconfig.json                 # TypeScript configuration.
└── .gitignore                    # Specifies intentionally untracked files that Git should ignore.
```
