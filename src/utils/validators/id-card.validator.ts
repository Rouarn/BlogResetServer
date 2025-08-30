/**
 * 身份证验证工具
 * 
 * 提供中国大陆身份证号码验证功能
 */

/**
 * 校验身份证号码格式
 * @param idCard 身份证号码
 * @returns 是否为合法身份证号码
 */
export const isIdCard = (idCard: string): boolean => {
  return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(idCard);
};

/**
 * 校验身份证号码（包含校验位验证）
 * @param idCard 身份证号码
 * @returns 是否为合法身份证号码
 */
export const isIdCardStrict = (idCard: string): boolean => {
  if (!isIdCard(idCard)) return false;
  
  // 校验位验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  return checkCode === idCard[17].toUpperCase();
};

/**
 * 从身份证号码中提取生日
 * @param idCard 身份证号码
 * @returns 生日字符串 (YYYY-MM-DD) 或 null
 */
export const extractBirthFromIdCard = (idCard: string): string | null => {
  if (!isIdCard(idCard)) return null;
  
  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  
  return `${year}-${month}-${day}`;
};

/**
 * 从身份证号码中提取性别
 * @param idCard 身份证号码
 * @returns 性别 ('male' | 'female') 或 null
 */
export const extractGenderFromIdCard = (idCard: string): 'male' | 'female' | null => {
  if (!isIdCard(idCard)) return null;
  
  const genderCode = parseInt(idCard[16]);
  return genderCode % 2 === 1 ? 'male' : 'female';
};

/**
 * 格式化身份证号码显示（隐藏中间部分）
 * @param idCard 身份证号码
 * @returns 格式化后的身份证号码
 */
export const formatIdCardDisplay = (idCard: string): string => {
  if (!isIdCard(idCard)) return idCard;
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
};