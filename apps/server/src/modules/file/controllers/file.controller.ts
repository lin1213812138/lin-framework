import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser, Public } from '@/core/decorators';
import type { AuthUser } from '@/modules/auth';
import { FileService } from '@/modules/file/services/file.service';
import { QueryFileDto } from '@/modules/file/dtos/query-file.dto';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fileService.upload(file, user.id, user.username);
  }

  @Get()
  @ApiOperation({ summary: '分页查询文件列表' })
  async findAll(@Query() query: QueryFileDto) {
    return this.fileService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件详情' })
  async findOne(@Param('id') id: string) {
    return this.fileService.findById(id);
  }

  @Public()
  @Get(':id/view')
  @ApiOperation({ summary: '查看文件（inline，用于浏览器直接显示）' })
  async view(@Param('id') id: string, @Res() res: Response) {
    const { stream, file } = await this.fileService.download(id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.originalName)}"`,
    );

    stream.pipe(res);
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { stream, file } = await this.fileService.download(id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    );
    res.setHeader('Content-Length', file.size);

    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  async remove(@Param('id') id: string) {
    return this.fileService.remove(id);
  }
}
