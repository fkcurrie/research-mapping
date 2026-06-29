# Use standard official Node.js light alpine base image
FROM node:20-alpine

# Set non-root system environment security parameters
ENV NODE_ENV=production

WORKDIR /app

# Copy dependency manifest
COPY package*.json ./

# Install only production dependencies securely
RUN npm ci --only=production

# Copy source code files (index.js, seed.js, etc.)
COPY . .

# Run as non-root node user for maximum security compliance
USER node

# Execute the daily scanner index script on container execution
CMD ["npm", "start"]
