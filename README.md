# FinanceBuddy

A personal finance tracker for managing accounts, expenses, income, recurring charges, and savings goals. Built as a team project for CISC474 at the University of Delaware, Fall 2025.

## Features

- **Dashboard** with income and expense history by month and year
- **Transactions:** create, edit, and delete expenses and income
- **Recurring charges:** track subscriptions and bills on monthly or yearly schedules
- **Accounts and goals:** track account balances and progress toward savings goals
- **Receipt scanning:** upload a photo of a receipt and Gemini extracts the details to fill in the form
- **Secure login** with Google through Auth0

## Tech Stack

- **Frontend:** React, TanStack Start, shadcn/ui
- **Backend:** NestJS REST API, deployed on Render
- **Database:** PostgreSQL on Supabase, with Prisma ORM
- **Auth:** Auth0 (Google OAuth), with JWTs verified using RS256 and JWKS
- **AI:** Google Gemini for receipt parsing
- **Tooling:** Turborepo monorepo, TypeScript, ESLint, Prettier

## My Contributions

- **Expense tracking:**
  - Built out the recurring charges feature, including the backend service logic, Prisma schema updates, the management page, and dashboard integration
  - Built the frontend for editing and deleting transactions, including the action dialogs
  - Connected the dashboard and profile pages to live API data, including expense and income history
- **Authentication:** Set up authentication in the NestJS API with Auth0, including the initial JWT strategy and auth module, protected the API endpoints, added a `/me` endpoint, and fixed the authentication table in the schema
- **Homepage:** Set up shadcn/ui and built the landing page

## Project Structure

- `apps/api`: NestJS backend
- `apps/web-start`: React frontend (TanStack Start)
- `packages/database`: Prisma schema and client
- `packages/api`: shared DTOs used by the frontend and backend

## Running Locally

1. Install Node 22.12 or higher
2. Clone the repo and run `npm install`
3. Create a `.env` file in the root with:
   - `DATABASE_URL` and `DIRECT_URL` (PostgreSQL connection strings)
   - `AUTH0_ISSUER_URL` and `AUTH0_AUDIENCE`
   - Your Gemini API key
4. Run `npx prisma db push` to set up the database
5. Run `npm run dev`

## Team

Daniel Mahler, Ben Kellner, Mason Kulikowski
