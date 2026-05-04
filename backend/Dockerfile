FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npx nest build
RUN test -f dist/main.js || (echo "ERROR: Build did not produce dist/main.js" && exit 1)

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["sh", "-c", "export TS_NODE_COMPILER_OPTIONS='{\"module\":\"commonjs\",\"moduleResolution\":\"node\"}' && for i in 1 2 3 4 5 6 7 8 9 10; do npx prisma db push --accept-data-loss --skip-generate && break; echo 'waiting db...'; sleep 3; done && npx ts-node --transpile-only prisma/seed-hw.ts && npx ts-node --transpile-only prisma/seed.ts && node dist/main"]
