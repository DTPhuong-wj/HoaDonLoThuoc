# ====================================================================
# DOCKERFILE CHO MINTPHARMA BACKEND SERVER (HoaDonLoThuoc)
# Chạy độc lập trên Render / Railway / Fly.io / VPS Cloud 24/7
# ====================================================================

FROM node:22-alpine

WORKDIR /app

# Cài đặt timezone và curl cho health check
RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Ho_Chi_Minh

# Cài đặt dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

# Sao chép mã nguồn backend và scripts
COPY server ./server
COPY tsconfig*.json ./

# Thiết lập biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

EXPOSE 5000

# Health check định kỳ
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Khởi chạy Backend Server
CMD ["npx", "tsx", "server/src/index.ts"]
