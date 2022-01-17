import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { File } from './entities/file.entity';
import { createReadStream, existsSync, mkdirSync, renameSync } from 'fs';
import { join, extname } from 'path';
import { Response } from 'express';
import * as sharp from 'sharp';
import { sharpSupportedType } from '../../util/types';
import { ErrorTypes } from '../error/enums/errorTypes.enum';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private config: AppConfig,
  ) {}

  async getStreamableFile(fileUuid: string, size: string, res: Response) {
    const fileRecord = await this.filesRepository.findOne({
      where: {
        uuid: fileUuid,
      },
    });
    const base = 'files';

    if (!fileRecord) throw new NotFoundException('File not found');

    let serveThumbnail: boolean;
    switch (size) {
      case 'original':
        serveThumbnail = false;
        break;
      case 'w_176_h_176':
      case 'w_0_h_320':
      case 'w_400_h_0':
        if (!sharpSupportedType(fileRecord.mimeType)) {
          throw new BadRequestException(
            ErrorTypes.THUMBNAIL_NOT_SUPPORTED_FOR_FILE_TYPE,
          );
        }
        serveThumbnail = true;
        break;
      default:
        throw new BadRequestException(ErrorTypes.INVALID_FILE_SIZE);
    }

    res.setHeader('content-type', fileRecord.mimeType);

    let filePath = join(
      process.cwd(),
      base,
      String(fileRecord.organizationId),
      fileRecord.fileName,
    );
    if (serveThumbnail) {
      filePath = join(
        process.cwd(),
        base,
        String(fileRecord.organizationId),
        size,
        fileRecord.fileName,
      );
    } else {
      res.setHeader(
        'Content-Disposition',
        ` attachment; filename="${fileRecord.originalName}"`,
      );
    }

    if (!existsSync(filePath)) throw new NotFoundException('File not found');

    const readStream = createReadStream(filePath);

    return readStream.pipe(res);
  }

  async store(
    file: Express.Multer.File,
    userId: number,
    organizationId: number,
  ) {
    const base = 'files';
    const fileName = file.filename + extname(file.originalname);
    const fileFolder = String(organizationId);
    const filePath = join(fileFolder, fileName);
    const diskPath = join(base, filePath);
    const thumbnails = {
      w_176_h_176: {
        width: 176,
        height: 176,
        fit: sharp.fit.cover,
      },
      w_0_h_320: {
        width: undefined,
        height: 320,
        fit: sharp.fit.inside,
      },
      w_400_h_0: {
        width: 400,
        height: undefined,
        fit: sharp.fit.inside,
      },
    };

    for (const sizeId in thumbnails) {
      const thumbnailFolder = join(fileFolder, sizeId);
      const dir = join(base, thumbnailFolder);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    renameSync(join(process.cwd(), file.path), diskPath);

    const fileRecord = new File();

    fileRecord.originalName = file.originalname;
    fileRecord.mimeType = file.mimetype;
    fileRecord.fileName = fileName;
    fileRecord.size = file.size;
    fileRecord.userId = userId;
    fileRecord.organizationId = organizationId;

    // add thumbnails if it s an image
    if (sharpSupportedType(file.mimetype)) {
      for (const sizeId in thumbnails) {
        const size = thumbnails[sizeId];
        const thumbnailFolder = join(fileFolder, sizeId);
        const thumbnailPath = join(thumbnailFolder, fileName);

        await sharp(diskPath, { failOnError: true })
          .resize(size)
          .toFile(join(base, thumbnailPath));
      }
    }

    await this.filesRepository.save(fileRecord);

    return {
      fileUuid: fileRecord.uuid,
      fileName: fileName,
      displayName: file.originalname,
    };
  }
}
