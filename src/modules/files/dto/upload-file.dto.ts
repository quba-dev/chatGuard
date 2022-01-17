import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    example: 'd53e650f-ab74-46a5-8822-ee5e06b134ef',
    description: 'file uuid',
  })
  fileUuid: string;

  @ApiProperty({
    example: '9e59fd22c1f1ac8ff5c6382220e352a8.png',
    description: 'uploaded file name',
  })
  fileName: string;

  @ApiProperty({
    example: 'profile photo.png',
    description: 'display file name',
  })
  displayName: string;
}
