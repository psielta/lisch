// validation/validator.go
package validation

import (
	"github.com/go-playground/validator/v10"
)

// Init retorna um *validator.Validate já com CPF e CNPJ registrados.
func Init() *validator.Validate {
	v := validator.New()

	// registra validação de CPF
	v.RegisterValidation("cpf", func(fl validator.FieldLevel) bool {
		return isValidCPF(fl.Field().String())
	})

	// registra validação de CNPJ
	v.RegisterValidation("cnpj", func(fl validator.FieldLevel) bool {
		return isValidCNPJ(fl.Field().String())
	})

	return v
}
