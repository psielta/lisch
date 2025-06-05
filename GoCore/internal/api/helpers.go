package api

import (
	"time"

	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/types"
)

// converte string → types.Decimal
func (api *Api) decimalFromString(s string) (types.Decimal, error) {
	var d types.Decimal
	if err := d.Scan(s); err != nil { // Parseia "123.45", "0.00" etc.
		return types.Decimal{}, err
	}
	return d, nil
}

// string vazia → NullDecimal nulo; caso contrário parseia
func (api *Api) nullDecimalFromString(s string) (types.NullDecimal, error) {
	var nd types.NullDecimal
	if s == "" {
		return nd, nil // nil pointer == NULL no banco
	}
	if err := nd.Scan(s); err != nil {
		return types.NullDecimal{}, err
	}
	return nd, nil
}

// Funções auxiliares
func (api *Api) removeDuplicateStrings(slice []string) []string {
	keys := make(map[string]bool)
	result := []string{}

	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}

	return result
}

func (api *Api) convertStringsToInterfaces(strings []string) []interface{} {
	interfaces := make([]interface{}, len(strings))
	for i, s := range strings {
		interfaces[i] = s
	}
	return interfaces
}

func (api *Api) toNullString(s *string) null.String {
	if s == nil {
		return null.String{}
	}
	return null.StringFrom(*s)
}

func (api *Api) toNullInt(i *int) null.Int {
	if i == nil {
		return null.Int{}
	}
	return null.IntFrom(*i)
}

func (api *Api) nullBoolToPtr(nb null.Bool) *bool {
	if !nb.Valid {
		return nil
	}
	return &nb.Bool
}

func (api *Api) derefNullDecimal(nd *types.NullDecimal) types.NullDecimal {
	if nd == nil {
		return types.NullDecimal{}
	}
	return *nd
}

func (api *Api) nullStringToPtr(ns null.String) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

func (api *Api) nullTimeToPtr(nt null.Time) *time.Time {
	if !nt.Valid {
		return nil
	}
	return &nt.Time
}

func (api *Api) nullIntToPtr(ni null.Int) *int {
	if !ni.Valid {
		return nil
	}
	v := int(ni.Int)
	return &v
}

func (api *Api) nullDecimalToPtr(nd types.NullDecimal) *types.NullDecimal {
	// types.NullDecimal já tem sua lógica interna de null/valid
	// Sempre retornamos o ponteiro, pois o próprio tipo gerencia isso
	return &nd
}

// Funções auxiliares mantidas para compatibilidade
func (api *Api) ptr(ns null.String) *string {
	return api.nullStringToPtr(ns)
}

func (api *Api) intPtr(ni null.Int) *int {
	return api.nullIntToPtr(ni)
}

func (api *Api) nullBoolFromPtr(b *bool) null.Bool {
	if b == nil {
		return null.Bool{}
	}
	return null.Bool{Bool: *b, Valid: true}
}
