export interface PaginatedResponse<T> {
  current_page: number;
  total_pages: number;
  page_size: number;
  total_count: number;
  items: T[];
}
export interface PaginationInput {
  page?: number; // Optional with default value of 1
  page_size?: number; // Optional with default value of 20
}
export interface PaginationInput2 {
  page?: number; // Optional with default value of 1
  limit?: number; // Optional with default value of 20
}
