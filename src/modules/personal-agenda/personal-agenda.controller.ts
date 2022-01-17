import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PersonalAgendaService } from './personal-agenda.service';
import { CreatePersonalAgendaDto } from './dto/create-personal-agenda.dto';
import { UpdatePersonalAgendaDto } from './dto/update-personal-agenda.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ProviderOrgRoles } from '../authentication/enums/user-roles.enum';
import { Roles } from '../authentication/roles.decorator';

@Controller('api/personal-agenda')
@ApiTags('api/personal-agenda')
export class PersonalAgendaController {
  constructor(private readonly personalAgendaService: PersonalAgendaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  create(
    @Body() createPersonalAgendaDto: CreatePersonalAgendaDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.personalAgendaService.create(
      createPersonalAgendaDto,
      tokenData.id,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getPersonalAgendaForUser(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.personalAgendaService.getPersonalAgendaForUser(
      page,
      limit,
      tokenData.id,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findOne(@Param('id') id: string, @Request() req: any) {
    const tokenData = req.user;

    return this.personalAgendaService.findOne(+id, tokenData.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  update(
    @Param('id') id: string,
    @Body() updatePersonalAgendaDto: UpdatePersonalAgendaDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;

    return this.personalAgendaService.update(
      +id,
      updatePersonalAgendaDto,
      tokenData.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  remove(@Param('id') id: string, @Request() req: any) {
    const tokenData = req.user;

    return this.personalAgendaService.remove(+id, tokenData.id);
  }
}
