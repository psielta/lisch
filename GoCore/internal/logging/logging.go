// internal/logging/logging.go
package logging

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

func New() *zap.Logger {
	// 1) destino em arquivo com rotação
	lj := &lumberjack.Logger{
		Filename:   "logs/app.log", // cria logs/ se não existir
		MaxSize:    100,            // MB por arquivo
		MaxBackups: 60,             // máximo de 60 arquivos
		// MaxAge opcional se quiser descartar arquivos antigos por dias
		LocalTime: true,  // usa horário local no nome
		Compress:  false, // gzip? → true se quiser
	}

	// 2) força corte diário (mesmo se não atingir 100 MB)
	go func() {
		for {
			// dorme até a próxima meia‑noite local
			now := time.Now()
			next := now.Truncate(24 * time.Hour).Add(24 * time.Hour)
			time.Sleep(time.Until(next))
			_ = lj.Rotate()
		}
	}()

	// 3) encoders
	fileEnc := zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())
	consoleEnc := zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())

	core := zapcore.NewTee(
		zapcore.NewCore(fileEnc, zapcore.AddSync(lj), zap.InfoLevel),            // arquivo
		zapcore.NewCore(consoleEnc, zapcore.AddSync(os.Stdout), zap.DebugLevel), // console
	)

	return zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))
}
