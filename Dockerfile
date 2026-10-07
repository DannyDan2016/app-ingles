# Imagen de la app (standalone). Solo para el stack local/CI de pruebas; Vercel no la usa.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# "1" compila content/_demo (solo stack E2E; Vercel nunca lo define).
ARG CONTENT_DEMO=
ENV CONTENT_DEMO=$CONTENT_DEMO
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle.config.ts /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
