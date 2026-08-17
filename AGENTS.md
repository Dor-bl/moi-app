# Base44 environment notes

- The app is a static HTML/CSS/JavaScript site with no build step, database, migrations, or required secrets.
- Run it with `docker compose -f docker-compose.base44.yml up -d`.
- Verify locally with `curl -fsS http://localhost:3000/` and externally shaped requests with `curl -fsS -H 'Host: external-preview.example.com' http://localhost:3000/`.
- Leaflet, map tiles, and Google Fonts load from public CDNs. The contact form uses FormSubmit directly from the browser and does not require a credential at boot.
- Source is bind-mounted into the web container, so static file edits are visible on browser refresh without rebuilding the image.
