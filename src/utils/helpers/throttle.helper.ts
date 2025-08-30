/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 间隔时间（毫秒）
 * @returns 节流后的新函数
 */
export const throttle = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 300,
): ((...args: Parameters<T>) => void) => {
  let last = 0;
  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn(...args);
    }
  };
};
