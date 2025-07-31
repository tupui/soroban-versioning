export async function retryAsync<T>(
  fn: () => Promise<T>,
  retries = 3,
  backoffMs = 250,
): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((res) => setTimeout(res, backoffMs * 2 ** attempt));
      attempt += 1;
    }
  }
}
