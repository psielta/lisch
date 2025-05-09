package validation

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

// FormatErrors converte qualquer validator.ValidationErrors num map[string]string
// usando as tags `json:"campo"` para chave e mensagens padronizadas.
func FormatErrors(err error, t reflect.Type) map[string]string {
	out := make(map[string]string)

	ve, ok := err.(validator.ValidationErrors)
	if !ok {
		// erro genérico (não é ValidationErrors)
		out["error"] = err.Error()
		return out
	}

	for _, fe := range ve {
		// pega a struct field para extrair tag json
		sf, _ := t.FieldByName(fe.StructField())
		jsonKey := strings.Split(sf.Tag.Get("json"), ",")[0]

		var msg string
		switch fe.Tag() {
		case "required":
			msg = fmt.Sprintf("'%s' é obrigatório", jsonKey)
		case "uuid":
			msg = fmt.Sprintf("'%s' deve ser um UUID válido", jsonKey)
		case "len":
			msg = fmt.Sprintf("'%s' deve ter exatamente %s caracteres", jsonKey, fe.Param())
		case "max":
			msg = fmt.Sprintf("'%s' não pode exceder %s caracteres", jsonKey, fe.Param())
		case "min":
			msg = fmt.Sprintf("'%s' deve ser no mínimo %s", jsonKey, fe.Param())
		default:
			msg = fmt.Sprintf("'%s' inválido: regra %s", jsonKey, fe.Tag())
		}

		// garante que não sobrescreva múltiplos erros no mesmo campo
		if _, seen := out[jsonKey]; !seen {
			out[jsonKey] = msg
		}
	}

	return out
}
