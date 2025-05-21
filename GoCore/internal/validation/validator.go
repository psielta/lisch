package validation

import (
	"regexp"

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

	// registra validação de CPF
	Validate.RegisterValidation("cpf", func(fl validator.FieldLevel) bool {
		return isValidCPF(fl.Field().String())
	})

	// registra validação de CNPJ
	Validate.RegisterValidation("cnpj", func(fl validator.FieldLevel) bool {
		return isValidCNPJ(fl.Field().String())
	})

}

// isValidCPF checa formato e dígitos verificadores de um CPF
func isValidCPF(raw string) bool {
	// só dígitos
	r := regexp.MustCompile(`\D`)
	clean := r.ReplaceAllString(raw, "")
	if len(clean) != 11 {
		return false
	}
	// não pode ser sequência igual
	for _, s := range []string{
		"00000000000", "11111111111", "22222222222", "33333333333",
		"44444444444", "55555555555", "66666666666", "77777777777",
		"88888888888", "99999999999",
	} {
		if clean == s {
			return false
		}
	}

	// converte em slice de ints
	nums := make([]int, 11)
	for i, r := range clean {
		nums[i] = int(r - '0')
	}

	// calcula 1º dígito verificador
	sum := 0
	for i := 0; i < 9; i++ {
		sum += nums[i] * (10 - i)
	}
	d1 := sum % 11
	if d1 < 2 {
		d1 = 0
	} else {
		d1 = 11 - d1
	}
	if nums[9] != d1 {
		return false
	}

	// calcula 2º dígito verificador
	sum = 0
	for i := 0; i < 10; i++ {
		sum += nums[i] * (11 - i)
	}
	d2 := sum % 11
	if d2 < 2 {
		d2 = 0
	} else {
		d2 = 11 - d2
	}
	return nums[10] == d2
}

// isValidCNPJ checa formato e dígitos verificadores de um CNPJ
func isValidCNPJ(raw string) bool {
	r := regexp.MustCompile(`\D`)
	clean := r.ReplaceAllString(raw, "")
	if len(clean) != 14 {
		return false
	}
	// não pode ser sequência igual
	for _, s := range []string{
		"00000000000000", "11111111111111", "22222222222222",
		"33333333333333", "44444444444444", "55555555555555",
		"66666666666666", "77777777777777", "88888888888888",
		"99999999999999",
	} {
		if clean == s {
			return false
		}
	}

	// converte em slice de ints
	nums := make([]int, 14)
	for i, r := range clean {
		nums[i] = int(r - '0')
	}

	// pesos para o 1º dígito
	weights1 := []int{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	sum := 0
	for i := 0; i < 12; i++ {
		sum += nums[i] * weights1[i]
	}
	d1 := sum % 11
	if d1 < 2 {
		d1 = 0
	} else {
		d1 = 11 - d1
	}
	if nums[12] != d1 {
		return false
	}

	// pesos para o 2º dígito
	weights2 := []int{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	sum = 0
	for i := 0; i < 13; i++ {
		sum += nums[i] * weights2[i]
	}
	d2 := sum % 11
	if d2 < 2 {
		d2 = 0
	} else {
		d2 = 11 - d2
	}
	return nums[13] == d2
}
