# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./

RUN go build -o /readability-server main.go

# Final stage
FROM alpine:latest

WORKDIR /

COPY --from=builder /readability-server /readability-server

# Install ca-certificates just in case we need to fetch HTTPS
RUN apk --no-cache add ca-certificates curl

EXPOSE 80

HEALTHCHECK --interval=5s CMD curl -f http://127.0.0.1/ok || exit 1

ENTRYPOINT ["/readability-server"]
