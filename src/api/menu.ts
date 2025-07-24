import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';

const initialState = {
  openedItem: 'dashboard',
  openedComponent: 'buttons',
  openedHorizontalItem: null,
  isDashboardDrawerOpened: false,
  isComponentDrawerOpened: true
};

export const endpoints = {
  key: 'api/menu',
  master: 'master',
  dashboard: '/dashboard' // server URL
};

export function useGetMenuMaster() {
  const { data, isLoading } = useSWR(endpoints.key + endpoints.master, () => initialState, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      menuMaster: data,
      menuMasterLoading: isLoading
    }),
    [data, isLoading]
  );

  return memoizedValue;
}

export function handlerDrawerOpen(isDashboardDrawerOpened: boolean) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster?: MenuMasterState) => {
      if (!currentMenuMaster) return { ...initialState, isDashboardDrawerOpened };
      return { ...currentMenuMaster, isDashboardDrawerOpened };
    },
    false
  );
}

interface MenuMasterState {
  openedItem: string;
  openedComponent: string;
  openedHorizontalItem: string | null;
  isDashboardDrawerOpened: boolean;
  isComponentDrawerOpened: boolean;
}

export function handlerActiveItem(openedItem: string) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster: MenuMasterState | undefined) => {
      if (!currentMenuMaster) return { ...initialState, openedItem };
      return { ...currentMenuMaster, openedItem };
    },
    false
  );
}
