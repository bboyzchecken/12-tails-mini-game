package logger

import (
	"time"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

// Middleware logs one line per HTTP request (method, path, status, duration).
func Middleware(log *logrus.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			req := c.Request()
			log.WithFields(logrus.Fields{
				"method": req.Method,
				"path":   req.URL.Path,
				"status": c.Response().Status,
				"ms":     time.Since(start).Milliseconds(),
			}).Info("request")
			return err
		}
	}
}
