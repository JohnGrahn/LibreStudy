# Use the official Bun image as base
FROM oven/bun:1 as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install production dependencies only
RUN bun install --production

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"] 