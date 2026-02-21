# DevPulse Dashboard

DevPulse is a lightweight GitHub analytics dashboard that helps developers and hiring managers quickly evaluate repository health and engineering velocity.

## Features

- Analyze any public GitHub repository (`owner/repo`)
- Track weekly commit frequency (last 12 buckets)
- Visualize issue flow (opened vs closed)
- View key repo metrics: stars, forks, open issues, watchers
- Optional token support to reduce rate-limit friction

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Charts:** Recharts
- **Data Source:** GitHub REST API v3

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local`:

```bash
GITHUB_TOKEN=your_github_personal_access_token
```

This token is optional for public repos but recommended for higher rate limits.

## Architecture (high-level)

- `app/page.tsx` — UI for repo input + charts + metrics cards
- `app/api/metrics/route.ts` — API route that validates input and returns computed analytics
- `lib/github.ts` — GitHub fetching and transformation logic (bucketed weekly metrics)

## Roadmap

- Add pull request lead-time metrics
- Add contributor-level breakdowns
- Add export-to-CSV for reports
- Add unit tests for bucket aggregation

## Why this project exists

This project is designed as a portfolio-ready example of practical full-stack engineering:

- API integration
- data transformation
- dashboard UX
- TypeScript-first code quality

## License

MIT
