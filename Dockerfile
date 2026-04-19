# Stage 1: Build Aplikasi Go
FROM golang:1.25-alpine AS builder

# Set Directory
WORKDIR /app

# Copy File go.mod dan go.sum untuk efisiensi cache
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server .

FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY --from=builder /app/server .

EXPOSE 80

ENTRYPOINT ["/app/server"]
