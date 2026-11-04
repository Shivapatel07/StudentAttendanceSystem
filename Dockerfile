FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# SQLite database is stored in /app/database. Mount a persistent volume there in production.
CMD ["npm", "start"]
