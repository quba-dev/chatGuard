import { Controller, Get } from '@nestjs/common';
import { UnitsService } from './units.service';

@Controller('/api/units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('')
  getAllDailychecksInProject() {
    return this.unitsService.findAll();
  }
}
