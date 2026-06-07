export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
