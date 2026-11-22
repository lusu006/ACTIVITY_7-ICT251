# Activity 7 - Campus Maintenance Requests API (ICT251)

Student details (Lusungu Ilunga, 202502786) are already in `server.js` (API guide at `/`).

## Run locally
```
npm install
copy .env.example .env     (macOS/Linux: cp .env.example .env)
npm start
```
Open http://localhost:3000. With `DATABASE_URL` empty it uses a local SQLite file (Node 22.5+).
On PowerShell, use `npm.cmd` if npm.ps1 is blocked.

Test: with the server running, `npm run test:api` (or use Postman with the table in Step 7).

## Host on Render (PostgreSQL, so data survives restarts)
1. Push this folder to GitHub (include package.json and package-lock.json; `.env` and node_modules are ignored).
2. Render -> New -> PostgreSQL (free). Copy its **Internal Database URL**.
3. Render -> New -> Web Service -> choose the repo. Build: `npm install`  Start: `npm start`  Instance: Free.
4. Environment variables: `DATABASE_URL` = the URL from step 2, `CLIENT_ORIGINS` = your Activity 8 frontend URL(s).
5. Deploy, open the HTTPS URL (API guide), check `/health`, then run `BASE_URL=https://your-backend.onrender.com npm run test:api`.
Submit the base URL (no trailing path), e.g. https://your-backend.onrender.com
