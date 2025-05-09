package helpers

import (
	"log"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func ToPgTypeNumeric(value float64) pgtype.Numeric {
	s := strconv.FormatFloat(value, 'f', -1, 64)
	var n pgtype.Numeric
	if err := n.Scan(s); err != nil {
		log.Fatalf("Erro ao converter float64 para pgtype.Numeric: %v", err)
	}
	return n
}

func ToPgTypeText(value string) pgtype.Text {
	var t pgtype.Text
	if err := t.Scan(value); err != nil {
		log.Fatalf("Erro ao converter string para pgtype.Text: %v", err)
	}
	return t
}

func ToPgTypeInt(value int) pgtype.Int4 {
	var i pgtype.Int4
	if err := i.Scan(value); err != nil {
		log.Fatalf("Erro ao converter int para pgtype.Int4: %v", err)
	}
	return i
}

func StringToPgTypeInt(value string) pgtype.Int4 {
	var i pgtype.Int4
	if err := i.Scan(value); err != nil {
		log.Fatalf("Erro ao converter string para pgtype.Int4: %v", err)
	}
	return i
}

func ToPgTypeUUID(value uuid.UUID) pgtype.UUID {
	var u pgtype.UUID
	if err := u.Scan(value); err != nil {
		log.Fatalf("Erro ao converter uuid.UUID para pgtype.UUID: %v", err)
	}
	return u
}

func StringToPgTypeUUIDConsiderNull(value string) (pgtype.UUID, error) {
	if value == "" {
		return pgtype.UUID{
			Valid: false,
		}, nil
	}
	return StringToPgTypeUUID(value)
}

func StringToPgTypeUUID(value string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(value); err != nil {
		return pgtype.UUID{}, err
	}
	return u, nil
}

func StrToText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func IntToInt4(i int) pgtype.Int4 {
	if i == 0 {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: int32(i), Valid: true}
}

func BoolToPg(b bool) pgtype.Bool {
	if b == false {
		return pgtype.Bool{}
	}
	return pgtype.Bool{Bool: b, Valid: true}
}

func DateStrToPg(s string) pgtype.Date {
	if s == "" {
		return pgtype.Date{}
	}
	t, _ := time.Parse("2006-01-02", s) // ignore error - val already validated
	var d pgtype.Date
	_ = d.Scan(t)
	return d
}

func UuidPtrToPg(id string) pgtype.UUID {
	if id == "" {
		return pgtype.UUID{}
	}
	u := uuid.MustParse(id)
	return pgtype.UUID{Bytes: u, Valid: true}
}
