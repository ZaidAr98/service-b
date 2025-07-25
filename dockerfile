FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose REST API port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]