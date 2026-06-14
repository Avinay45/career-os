# CareerOS | AI-Powered Career Operating System

CareerOS is a high-performance, dark-mode career advancement workspace designed to streamline the job search process. It integrates resume parsing, real-time ATS optimization, cover letter generation, interactive mock interview simulations, and Kanban application tracking into a unified, serverless dashboard.

---

## 🚀 Key Features

*   **Resume Intelligence**: Automatically parses and extracts skills, certifications, and formatting metrics from resumes.
*   **ATS Score Simulator**: Scores resumes across Formatting, Keyword Density, Impact, and Readability with actionable improvement suggestions.
*   **Job Description Matcher**: Compares candidate profiles directly with target job descriptions to identify skill alignments and missing keywords.
*   **Cover Letter Generator**: Dynamically drafts personalized, role-specific cover letters using candidate resume context and job expectations.
*   **Interactive Mock Interviews**: Simulated behavioral and technical prep sessions with AI-driven scoring, feedback, weakness logging, and personalized study guides.
*   **Kanban Application Tracker**: Track job applications from wishlist to screen, technical round, and accepted offers.
*   **Real-Time AI Coach (SSE Streaming)**: Server-Sent Events stream answers word-by-word with tab-targeted context pruning to minimize latency and token usage.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, Turbopack)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security (RLS), triggers, and DB functions)
*   **AI Inference**: [OpenRouter API](https://openrouter.ai/) (Model: `nousresearch/hermes-3-llama-3.1-70b`)
*   **Styling**: Tailwind CSS, CSS Variables, and Lucide React Icons
*   **Telemetry**: Lightweight client-server logging for security, audit, and performance tracing.

---

## 📂 Project Structure

```
├── .next/                  # Next.js build output
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router (Layouts, pages, action endpoints)
│   │   ├── actions/        # Server Actions (AI analysis)
│   │   ├── api/chat/       # SSE chat stream handler
│   │   ├── login/          # Authentication pages
│   │   └── signup/
│   ├── components/         # Reusable UI widgets and loaders
│   ├── features/           # Modularized domain logic
│   │   ├── auth/           # Authenticated route guards
│   │   ├── chat/           # Conversational AI coach service
│   │   ├── interviews/     # Mock prep sessions, unit tests, and metrics
│   │   ├── jobs/           # Match engine, parsing, and query builders
│   │   └── applications/   # Kanban pipelines and analytics
│   ├── lib/                # Shared clients (Supabase client proxy, OpenRouter)
│   └── middleware.ts       # Route protector (session validation)
├── supabase/
│   └── schema.sql          # PostgreSQL DDL migrations script
├── package.json
└── tsconfig.json
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/Avinay45/career-os.git
cd career-os
npm install
```

### 3. Configure Environment Variables
Locate the `.env.local` configuration values provided to you and add them to your local project directory. Do not commit this file.

### 4. Execute Database Migrations
Deploy the database schema, compound performance indexes, RLS policies, and triggers on your Supabase project:
```bash
npx tsx run-migrations.ts
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing and Quality Assurance

We maintain unit, security, and performance test suites:

*   **Security Validation**: Verify rate-limiting and input prompt injection sanitizers:
    ```bash
    npx tsx verify-security.ts
    ```
*   **Performance Benchmark**: Assert context compilation speed and tab-targeted token pruning:
    ```bash
    npx tsx verify-performance.ts
    ```
*   **Interview Intelligence**: Run unit testing checks on behavioral evaluation metrics:
    ```bash
    npx tsx src/features/interviews/tests/run-tests.ts
    ```
*   **Production Compilation**: Ensure the build succeeds cleanly:
    ```bash
    npm run build
    ```

---

## ☁️ Production Deployment on Vercel

1. Push your repository to a private GitHub repository.
2. Link your repository inside the Vercel Dashboard.
3. Configure the 6 environment variables listed under the local setup section.
4. Deploy. Vercel will configure SSL automatically and serve the app serverlessly.
