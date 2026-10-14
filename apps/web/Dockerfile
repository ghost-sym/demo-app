# Build the SPA. VITE_API_BASE is baked in at build time (Vite inlines
# import.meta.env.*), so it must point at the API app's public URL + /api.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# Serve the static build with a tiny static file server (no nginx).
# `serve -s` handles SPA history fallback.
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
