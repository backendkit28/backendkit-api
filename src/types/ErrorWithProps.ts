export interface ErrorWithProps extends Error {
  statusCode?: number;
}