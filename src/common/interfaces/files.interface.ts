/**
 * 静态配置接口（StaticConfig）
 *
 * 定义了上传文件相关的静态配置项。
 *
 * 功能说明：
 * - 包含上传文件的最大批量数量、最大文件大小和允许的文件类型。
 *
 * 接口说明：
 * - `maxBatchFiles`：最大批量上传文件数量。
 * - `maxFileSize`：最大文件大小（单位：字节）。
 * - `allowedTypes`：允许的文件类型数组。
 */
export interface StaticConfig {
  upload: {
    /**
     * 最大批量上传文件数量
     *
     * 说明：
     * - 配置上传文件的最大批量数量，超过该数量将抛出异常。
     *
     * 示例：
     * - 配置为 5 表示最多同时上传 5 个文件。
     */
    maxBatchFiles: number;
    /**
     * 最大文件大小（单位：字节）
     *
     * 说明：
     * - 配置上传文件的最大大小，超过该大小将抛出异常。
     *
     * 示例：
     * - 配置为 1048576 表示最大文件大小为 1MB。
     */
    maxFileSize: number;
    /**
     * 允许的文件类型数组
     *
     * 说明：
     * - 配置上传文件的允许类型，超过该类型将抛出异常。
     *
     * 示例：
     * - 配置为 ['image/jpeg', 'image/png'] 表示只允许上传 JPEG 和 PNG 格式的文件。
     */
    allowedTypes: string[];
  };
}
