# Use Node 20 or later
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install deps with regular npm install
RUN npm install

# Copy rest of the app
COPY . .

# Build your NestJS app
RUN npm run build

# Expose the port (default NestJS is 3000)
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:prod"]
