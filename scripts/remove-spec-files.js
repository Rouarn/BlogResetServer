const fs = require('fs');
const path = require('path');

/**
 * 递归删除所有 .spec.ts 文件
 * @param {string} dir - 要搜索的目录
 */
function removeSpecFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 递归处理子目录
        removeSpecFiles(filePath);
      } else if (file.endsWith('.spec.ts')) {
        // 删除 .spec.ts 文件
        try {
          fs.unlinkSync(filePath);
          console.log(`已删除: ${filePath}`);
        } catch (error) {
          console.error(`删除失败 ${filePath}:`, error.message);
        }
      }
    });
  } catch (error) {
    console.error(`读取目录失败 ${dir}:`, error.message);
  }
}

// 从项目根目录开始搜索
const projectRoot = path.resolve(__dirname, '..');
console.log(`开始从 ${projectRoot} 搜索并删除所有 .spec.ts 文件...`);

removeSpecFiles(projectRoot);

console.log('删除操作完成！');