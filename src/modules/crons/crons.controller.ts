import { Controller } from '@nestjs/common';
import { CronsService } from './crons.service';

@Controller('crons')
export class CronsController {
  constructor(private readonly cronsService: CronsService) {}
}
