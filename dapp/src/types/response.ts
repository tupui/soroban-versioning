export interface Response<T> {
  data: T | null;
  error: boolean;
  errorCode: number;
  errorMessage: string;
}
