# Student Feedback Manager Backend

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3dbabe48-aaa2-4ce2-8b86-18874e22819e" />


Express + MongoDB backend for the Student Feedback Manager project.

## Run

```bash
npm install
npm start
```

## Deploy on Vercel

This repo now includes a `vercel.json` and an `api/index.js` entrypoint.

```bash
npm i -g vercel
vercel login
vercel
```

## Environment

Create a `.env` file with your Atlas URI:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/Phase-6?retryWrites=true&w=majority&appName=Phase06
PORT=5001
```

## What changed

- The server now retries MongoDB connections before giving up.
- If the configured port is busy, the server automatically tries the next port.
- The backend is import-safe for Vercel serverless deployment.
- The feedback API saves only to MongoDB and returns a clear error if Atlas is unreachable.

## If Atlas fails

If you see `querySrv ECONNREFUSED`, check these first:

- Your Atlas IP access list includes your current IP.
- The username and password in `MONGO_URI` are correct.
- The cluster is active and the SRV hostname is reachable from your network.
- If SRV DNS is blocked, add a non-SRV URI as `MONGO_URI_FALLBACK` and restart.

## API

- `GET /api/health`
- `GET /api/feedback`
- `POST /api/feedback`
- `DELETE /api/feedback/:id`
- `GET /api/feedback/stats`#
