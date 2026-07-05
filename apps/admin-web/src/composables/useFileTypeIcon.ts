import pdfIcon from '@/assets/icons/pdf.svg';
import zipIcon from '@/assets/icons/zip.svg';
import txtIcon from '@/assets/icons/txt.svg';
import csvIcon from '@/assets/icons/csv.svg';
import xlsxIcon from '@/assets/icons/xlsx.svg';
import docIcon from '@/assets/icons/doc.svg';
import docxIcon from '@/assets/icons/docx.svg';
import codeIcon from '@/assets/icons/code.svg';
import imageIcon from '@/assets/icons/image.svg';
import mp3Icon from '@/assets/icons/mp3.svg';
import mp4Icon from '@/assets/icons/mp4.svg';
import pptxIcon from '@/assets/icons/pptx.svg';
import exeIcon from '@/assets/icons/exe.svg';
import defaultIcon from '@/assets/icons/default.svg';

export function useFileTypeIcon() {
  function getFileTypeIcon(extension: string): string {
    const ext = extension.replace('.', '').toLowerCase();
    if (ext === 'pdf') return pdfIcon;
    if (ext === 'txt') return txtIcon;
    if (ext === 'csv') return csvIcon;
    if (['xls', 'xlsx'].includes(ext)) return xlsxIcon;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return zipIcon;
    if (ext === 'doc') return docIcon;
    if (ext === 'docx') return docxIcon;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return imageIcon;
    if (
      [
        'js',
        'ts',
        'jsx',
        'tsx',
        'json',
        'xml',
        'html',
        'css',
        'scss',
        'py',
        'java',
        'go',
        'rs',
        'c',
        'cpp',
      ].includes(ext)
    )
      return codeIcon;
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return mp3Icon;
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) return mp4Icon;
    if (ext === 'pptx') return pptxIcon;
    if (['exe', 'msi'].includes(ext)) return exeIcon;
    return defaultIcon;
  }

  function isImage(extension: string): boolean {
    const ext = extension.replace('.', '').toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
  }

  return {
    getFileTypeIcon,
    isImage,
  };
}
