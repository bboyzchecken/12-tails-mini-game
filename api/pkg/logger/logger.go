package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

// New returns the shared application logger (Logrus).
func New() *logrus.Logger {
	l := logrus.New()
	l.SetOutput(os.Stdout)
	l.SetFormatter(&logrus.TextFormatter{FullTimestamp: true})
	l.SetLevel(logrus.InfoLevel)
	return l
}
