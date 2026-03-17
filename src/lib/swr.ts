export const fetcher = (url: string) => fetch(url).then((r) => r.json());

export const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 3,
};
