import { Controller } from '@nestjs/common';
import { ScaffoldService } from './scaffold.service';

@Controller('scaffold')
export class ScaffoldController {
  constructor(private readonly scaffoldService: ScaffoldService) {}
}
