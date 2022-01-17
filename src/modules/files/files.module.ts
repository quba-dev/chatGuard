import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../configuration/configuration.module';
import { File } from './entities/file.entity';

@Module({
  imports: [AppConfigModule, TypeOrmModule.forFeature([File])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
