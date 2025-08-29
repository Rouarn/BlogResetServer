/**
 * 深拷贝对象
 * @param obj 任意对象
 * @returns 深拷贝后的新对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
