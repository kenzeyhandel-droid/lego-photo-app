Lego Photo Webapp — Deployable fullstack project
===============================================

Structure
- frontend/   -> React + Vite frontend (calls backend for PDF + XML)
- backend/    -> FastAPI backend (generates PDF via ReportLab, BrickLink XML)
- docker-compose.yml -> easy local deployment or deploy to services that use Docker

Quick local dev (requires Docker)
1. Build and run:
   docker-compose up --build -d
2. Frontend will be at http://localhost (port 80), backend at http://localhost:8000
3. Use the web UI to upload an image, generate mosaic, then use 'Download PDF' to get server-generated PDF.

Deploying online
- You can deploy this to any Docker-compatible host (Render, Fly.io, Railway, DigitalOcean App Platform).
- For Render: create two services or one static site + web service. Push repo to GitHub and follow Render's guide to connect and deploy.
- For simple single-server deployments, you can run docker-compose on a VM (e.g., an Ubuntu droplet on DigitalOcean).

Android / Tablet App options
1) Progressive Web App (PWA) — easiest path
   - Make the frontend a PWA (add a manifest.json and service worker) and host it.
   - Users can 'Add to Home Screen' on Android; works offline for cached pages (but PDF generation needs backend online).
   - Pros: single codebase, instant deployment, no Play Store review required (unless you want Play Store distribution).

2) React Native / Expo — native app
   - Create a React Native project (Expo) that wraps the same UI and calls the backend API for PDF/XML generation.
   - Pros: native experience, distribution via Google Play / Apple App Store.
   - Cons: requires building and maintaining a separate app, handling permissions and file downloads on mobile.

3) Android WebView wrapper (Hybrid)
   - Use a small native wrapper that loads the hosted webapp in a WebView. Good for Play Store distribution without rewriting UI.

Recommendation:
- Start with a PWA. If you later need native features (camera access, file system control), upgrade to React Native / Expo and reuse business logic and backend APIs.

Notes about BrickLink XML & colorIDs
- The backend generates a BrickLink-style XML containing ITEM entries with ITEMID (part) and COLOR (BrickLink color ID).
- BrickLink expects very specific XML formats for direct import; always validate the produced XML in a test account or check documentation at BrickLink before mass-import.

Security & production notes
- Add rate-limiting and file-size checks for uploads if you extend to accept server-side image uploads.
- Use HTTPS in production and configure CORS properly to restrict domains.
- Consider caching PDF results for repeated downloads to save CPU time.

