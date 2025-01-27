# Use the official Bun image as base
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the frontend
RUN bun run build

# Expose the port the app runs on
EXPOSE 3000

# Start the frontend server
CMD ["bun", "run", "server"] 