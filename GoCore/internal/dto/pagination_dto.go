package dto

import "math"

type PaginatedResponse[T any] struct {
	CurrentPage int   `json:"current_page"`
	TotalPages  int   `json:"total_pages"`
	PageSize    int   `json:"page_size"`
	TotalCount  int64 `json:"total_count"`
	Items       []T   `json:"items"`
}

func NewPaginated[T any](items []T, currentPage, pageSize int, totalCount int64) PaginatedResponse[T] {
	var totalPages int
	if pageSize > 0 {
		totalPages = int(math.Ceil(float64(totalCount) / float64(pageSize)))
	}
	return PaginatedResponse[T]{
		CurrentPage: currentPage,
		TotalPages:  totalPages,
		PageSize:    pageSize,
		TotalCount:  totalCount,
		Items:       items,
	}
}
