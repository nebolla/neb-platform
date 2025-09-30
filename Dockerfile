FROM node:20-alpine AS deps
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN corepack enable && pnpm i --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm --filter web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
EXPOSE 3000
CMD ["pnpm","--filter","web","start","--","-p","3000","--hostname","0.0.0.0"]
