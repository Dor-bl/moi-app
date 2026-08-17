# Base44 development notes

- This is a static vanilla HTML/CSS/JavaScript app; it has no package manifest or build step.
- Run the preview with `docker compose -f docker-compose.base44.yml up -d`.
- The Compose service bind-mounts the repository and uses `live-server`, so source edits reload without rebuilding an image.
- Verify with `curl -fsS -H 'Host: external-preview.example.com' http://localhost:3000/` and confirm the response contains `MoiCheck`.
- Browser-only integrations (Leaflet/CARTO tiles, Google Fonts, FutureLearn, and FormSubmit) use public endpoints and do not require boot-time secrets.
