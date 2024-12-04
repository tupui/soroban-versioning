export interface Response<T> {
  data: T | null;
  error: boolean;
  errorMessage: string;
}
