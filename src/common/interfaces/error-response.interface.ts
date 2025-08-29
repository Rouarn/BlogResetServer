export interface ErrorResponse {
  success: boolean;
  code: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
