package dto

import "gobid/internal/models_sql_boiler"

type CulinariaDTO struct {
	IDCulinaria int    `json:"id_culinaria"`
	Nome        string `json:"nome"`
	MeioMeio    int16  `json:"meio_meio"`
}

func ConvertSQLBoilerCulinariaToDTO(culinaria *models_sql_boiler.Culinaria) CulinariaDTO {
	return CulinariaDTO{
		IDCulinaria: int(culinaria.IDCulinaria),
		Nome:        culinaria.Nome,
		MeioMeio:    culinaria.MeioMeio,
	}
}

func ConvertSQLBoilerCulinariasListToDTO(culinarias models_sql_boiler.CulinariaSlice) []CulinariaDTO {
	result := make([]CulinariaDTO, len(culinarias))

	for i, culinaria := range culinarias {
		result[i] = ConvertSQLBoilerCulinariaToDTO(culinaria)
	}

	return result
}
