
import { SWRConfiguration } from 'swr';

export const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 5000,
  refreshInterval: 0,
  shouldRetryOnError: false,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
};
