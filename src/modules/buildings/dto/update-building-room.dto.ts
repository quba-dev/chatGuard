import { PartialType } from '@nestjs/swagger';
import { CreateBuildingRoomDto } from './create-building-room.dto';

export class UpdateBuildingRoomDto extends PartialType(CreateBuildingRoomDto) {}
