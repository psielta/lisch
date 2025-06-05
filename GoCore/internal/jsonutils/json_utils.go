package jsonutils

import (
	"encoding/json"
	"fmt"
	"gobid/internal/usecase/validator"
	"gobid/internal/validation"
	"net/http"
	"reflect"
)

func EncodeJson[T any](w http.ResponseWriter, r *http.Request, statusCode int, data T) error {
	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		return fmt.Errorf("failed to encode json %w", err)
	}

	return nil
}

func DecodeValidJson[T validator.Validator](r *http.Request) (T, map[string]string, error) {
	var data T
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		return data, nil, fmt.Errorf("decode json %w", err)
	}

	if problems := data.Valid(r.Context()); len(problems) > 0 {
		return data, problems, fmt.Errorf("invalid %T: %d problems", data, len(problems))
	}

	return data, nil, nil
}

func DecodeJson[T any](r *http.Request) (T, error) {
	var data T
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		return data, fmt.Errorf("decode json failed: %w", err)
	}

	return data, nil
}

func DecodeValidJsonV10[T any](r *http.Request) (T, map[string]string, error) {
	var data T
	// 1) decode do JSON
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		return data, map[string]string{"error": err.Error()}, fmt.Errorf("decode json: %w", err)
	}
	// 2) valida tags `validate:"..."` no struct
	if err := validation.Validate.Struct(data); err != nil {
		problems := validation.FormatErrors(err, reflect.TypeOf(data))
		// Convert problems map to single error message
		var errMsg string
		for _, msg := range problems {
			errMsg = msg // Take first error message
			break
		}
		return data, map[string]string{"error": errMsg}, fmt.Errorf("invalid %T: %d problems", data, len(problems))
	}
	return data, nil, nil
}

func Marshal(v any) ([]byte, error) {
	return json.Marshal(v)
}

func Unmarshal(data []byte, v any) error {
	return json.Unmarshal(data, v)
}

/*


func DecodeValidJsonV10[T any](r *http.Request) (T, map[string]string, error) {
	var data T
	// 1) decode do JSON
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		return data, nil, fmt.Errorf("decode json: %w", err)
	}
	// 2) valida tags `validate:"..."` no struct
	if err := validation.Validate.Struct(data); err != nil {
		problems := validation.FormatErrors(err, reflect.TypeOf(data))
		return data, problems, fmt.Errorf("invalid %T: %d problems", data, len(problems))
	}
	return data, nil, nil
}

*/
