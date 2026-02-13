# Use Node 20 as the base (matches Vercel)
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the frontend
RUN npm run build

# Expose ports for both frontend and backend
EXPOSE 5173 5000

# Default command runs the dev environment
CMD ["npm", "run", "dev"]
