# syntax=docker/dockerfile:1

FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

# Reproducible production dependency installation
RUN npm ci --omit=dev


FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Install available Alpine security patches
# npm is not needed at runtime, so remove it to reduce attack surface
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]