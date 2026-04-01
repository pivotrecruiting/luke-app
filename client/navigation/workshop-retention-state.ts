let hasPresentedExpiredWorkshopCat = false;

export const markExpiredWorkshopCatPresented = (): void => {
  hasPresentedExpiredWorkshopCat = true;
};

export const resetExpiredWorkshopCatPresented = (): void => {
  hasPresentedExpiredWorkshopCat = false;
};

export const getHasPresentedExpiredWorkshopCat = (): boolean =>
  hasPresentedExpiredWorkshopCat;
