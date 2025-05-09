package validation

import (
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// Validate é a instância global que você importa em todo lugar
var Validate = validator.New()

func init() {
	// registra uma regra "uuid" genérica (servirá para qualquer campo string que deva ser UUID)
	Validate.RegisterValidation("uuid", func(fl validator.FieldLevel) bool {
		_, err := uuid.Parse(fl.Field().String())
		return err == nil
	})
}
