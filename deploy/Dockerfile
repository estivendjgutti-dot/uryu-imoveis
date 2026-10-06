FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
RUN mkdir uploads && chown node:node uploads
USER node
EXPOSE 3001
CMD ["node", "server/index.mjs"]
