import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileRecord } from './file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { BlobStorageService } from '../blob-storage/blob-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileRecord])],
  controllers: [FilesController],
  providers: [FilesService, BlobStorageService],
})
export class FilesModule {}
