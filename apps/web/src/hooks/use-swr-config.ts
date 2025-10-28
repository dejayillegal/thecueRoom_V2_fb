
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 60000,
  shouldRetryOnError: false,
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  suspense: false,
  focusThrottleInterval: 60000,
};

export default swrConfig;
