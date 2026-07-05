/** DI token for StorageDriver */
export const STORAGE_TOKEN = 'STORAGE_DRIVER';

/** Result of a successful file upload */
export interface StoredFileInfo {
  /** UUID-based filename stored on disk */
  storedName: string;
  /** Relative path from storage root, e.g. "2026/03/15/uuid.ext" */
  path: string;
  /** Accessible URL for downloading */
  url: string;
}

/**
 * 存储驱动接口
 *
 * 抽象文件存储操作，支持本地磁盘 / S3 / OSS 等多种后端。
 * FileService 通过此接口进行文件存取，不关心底层实现。
 */
export interface StorageDriver {
  /**
   * 上传文件
   * @param buffer 文件二进制数据
   * @param options.originalName 原始文件名
   * @param options.mimeType MIME 类型
   * @param options.extension 扩展名（含 .）
   */
  upload(
    buffer: Buffer,
    options: { originalName: string; mimeType: string; extension: string },
  ): Promise<StoredFileInfo>;

  /** 删除文件 */
  delete(path: string): Promise<void>;

  /** 获取文件读取流 */
  getStream(path: string): Promise<NodeJS.ReadableStream>;
}
