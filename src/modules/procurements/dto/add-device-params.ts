import { IsString } from 'class-validator';

export class AddDeviceParams {
  @IsString()
  deviceId: string;
}
