# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_BIGWATER_TOKEN_ADDRESS=0xC9B1B2842c60303a06F60FDd005654575d6aE466
ENV VITE_BIGWATER_NFT_ADDRESS=0x74C0Eff3ba0971B9dc7842575DC881d435975dB4
ENV VITE_DEVICE_REGISTRY_ADDRESS=0xb77B308D2235773C9FabC2a6193bE8dE85178D7f
ENV VITE_REWARD_DISTRIBUTION_ADDRESS=0xD07C9456361DfAE1A64a7460c5f08900A7440cB7
ENV VITE_STAKING_ADDRESS=0x0f01172dA622595293Efe0231992E48D39d9E140
ENV VITE_CHAIN_ID=50
ENV VITE_RPC_URL=https://rpc.xinfin.network
ENV VITE_EXPLORER_URL=https://explorer.xinfin.network
ENV VITE_RP_NAME="BigWater DePIN"
ENV VITE_RP_ID=localhost
ENV VITE_API_URL=http://localhost:4000/api
ENV VITE_APP_URL=http://localhost:3000
ENV VITE_DEVICE_REGISTRY_OWNER_KEY=0x3ce8dc8235e975b2d83e8816dc22609a3931780d4a9d4ec6e7ca9a2936e9cdfe

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
