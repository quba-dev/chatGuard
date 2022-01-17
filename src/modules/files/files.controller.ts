import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UploadFileDto } from './dto/upload-file.dto';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('api/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('/:fileUuid')
  @ApiTags('api/files')
  async getFile(
    @Param('fileUuid') fileUuid: string,
    @Query('size') size = 'original',
    @Res() res,
  ) {
    return await this.filesService.getStreamableFile(fileUuid, size, res);
  }

  @Post('upload')
  @ApiTags('api/files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { dest: './files' }))
  @ApiCreatedResponse({
    description: 'The file has been uploaded',
    type: UploadFileDto,
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<UploadFileDto> {
    const tokenData = req.user;
    return this.filesService.store(
      file,
      tokenData.id,
      tokenData.organizationId,
    );
  }
}
