FROM mcr.microsoft.com/playwright:v1.65.0-noble
WORKDIR /tests
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "test:local"]
