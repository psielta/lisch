package decimalutils

import (
	"github.com/volatiletech/sqlboiler/v4/types"
)

// FromString converte uma string num tipos.Decimal.
// Internamente chama (*Decimal).UnmarshalText, que preenche o *decimal.Big.
func FromString(s string) (types.Decimal, error) {
	var d types.Decimal
	if err := d.UnmarshalText([]byte(s)); err != nil {
		return types.Decimal{}, err
	}
	return d, nil
}

func FromStringToNullDecimal(s string) (types.NullDecimal, error) {
	var d types.NullDecimal
	if err := d.UnmarshalText([]byte(s)); err != nil {
		return types.NullDecimal{}, err
	}
	return d, nil
}
