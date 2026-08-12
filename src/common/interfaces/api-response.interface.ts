export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: Array<{ field?: string; message: string }> | null;
}
