export const toHexString = (arr: number[]) =>
  Array.from(arr, (i: number) => i.toString(16).padStart(2, "0")).join("");
