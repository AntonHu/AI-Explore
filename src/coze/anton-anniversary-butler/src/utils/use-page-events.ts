import Taro, {
  usePageScroll,
  usePullDownRefresh,
  useReachBottom,
} from "@tarojs/taro";

export const getPageEvent = () => {
  // @ts-expect-error 暂时忽略
  return Taro.getCurrentInstance().page?.pageEvent;
};

export const usePageEvents = () => {
  usePageScroll(() => {
    getPageEvent()?.onPageScroll?.();
  });

  useReachBottom(() => {
    getPageEvent()?.onReachBottom?.();
  });

  usePullDownRefresh(() => {
    const result = getPageEvent()?.onPullDownRefresh?.();
    if (result instanceof Promise) {
      result.then(() => {
        Taro.stopPullDownRefresh();
      });
    } else {
      Taro.stopPullDownRefresh();
    }
  });
};
