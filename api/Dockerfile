# Multi-stage build → small static binary on Alpine (for AWS deploy later).
FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/api .

FROM alpine:latest
RUN apk --no-cache add tzdata ca-certificates
ENV TZ=Asia/Bangkok
WORKDIR /app
COPY --from=build /out/api .
EXPOSE 5000
CMD ["./api"]
