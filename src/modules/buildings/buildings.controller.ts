import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProviderOrgRoles } from '../authentication/enums/user-roles.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';
import { BuildingLevelsService } from './building-levels.service';
import { BuildingRoomsService } from './building-rooms.service';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { TenantLocationDto } from './dto/tenant-location.dto';
import { TenantLocationsService } from './tenant-locations.service';
import { validateBulk } from '../../util/bulk-validator';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { UpdateBuildingLevelDto } from './dto/update-building-level.dto';
import { CreateBuildingRoomDto } from './dto/create-building-room.dto';
import { UpdateBuildingRoomDto } from './dto/update-building-room.dto';

@Controller('api/buildings')
@ApiTags('api/buildings')
export class BuildingsController {
  constructor(
    private readonly buildingsService: BuildingsService,
    private readonly buildingLevelsService: BuildingLevelsService,
    private readonly buildingRoomsService: BuildingRoomsService,
    private readonly tenantLocationService: TenantLocationsService,
  ) {}

  // @Post('/with-nested-values')
  // createWithNestedValues(@Body() createBuildingDto: CreateBuildingDto) {
  //   return this.buildingsService.createWithNestedValues(createBuildingDto);
  // }

  @Post('/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  async bulk(@Body() operations: any[]) {
    const result: any[] = [];

    for (const operation of operations) {
      try {
        //building
        if (operation.type === 'create_building') {
          const validationError = await validateBulk(
            new CreateBuildingDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult = await this.buildingsService.create(
              operation.data,
            );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_building') {
          const validationError = await validateBulk(
            new UpdateBuildingDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult = await this.buildingsService.update(
              operation.id,
              operation.data,
            );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_building') {
          const intermediateResult = await this.buildingsService.remove(
            operation.id,
          );
          result.push(intermediateResult);
        }
        //building level
        if (operation.type === 'create_building_level') {
          const validationError = await validateBulk(
            new UpdateBuildingLevelDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult = await this.buildingLevelsService.create(
              operation.data,
            );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_building_level') {
          const validationError = await validateBulk(
            new UpdateBuildingLevelDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult = await this.buildingLevelsService.update(
              operation.id,
              operation.data,
            );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_building_level') {
          const intermediateResult = await this.buildingLevelsService.remove(
            operation.id,
          );
          result.push(intermediateResult);
        }
        //building room
        if (operation.type === 'create_building_room') {
          const validationError = await validateBulk(
            new CreateBuildingRoomDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult = await this.buildingRoomsService.create(
              operation.data,
            );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_building_room') {
          const validationError = await validateBulk(
            new UpdateBuildingRoomDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult = await this.buildingRoomsService.update(
              operation.id,
              operation.data,
            );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_building_room') {
          const intermediateResult = await this.buildingRoomsService.remove(
            operation.id,
          );
          result.push(intermediateResult);
        }
      } catch (e) {
        result.push({
          isError: true,
          status: e.status,
          message: e.message,
        });
      }
    }
    return result;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(+id);
  }

  @Get('/full-info/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  findAllFullInfo(@Param('projectId') projectId: string, @Request() req: any) {
    const tokenData = req.user;
    return this.buildingsService.getAllBuildingsInProjectFullInfo(
      +projectId,
      tokenData.id,
    );
  }

  @Get('/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Query('forUserId') forUserId = 0,
  ) {
    const tokenData = req.user;
    return this.buildingsService.getAllBuildingsInProject(
      +projectId,
      tokenData.id,
      forUserId,
    );
  }

  @Get('/levels/by-building-id/:buildingId')
  @UseGuards(JwtAuthGuard)
  findAllLevelsInBuilding(
    @Param('buildingId') buildingId: string,
    @Request() req: any,
    @Query('forUserId') forUserId = 0,
  ) {
    const tokenData = req.user;
    return this.buildingsService.getAllLevelsInBuilding(
      +buildingId,
      tokenData.id,
      forUserId,
    );
  }

  @Get('/rooms/by-level-id/:levelId')
  @UseGuards(JwtAuthGuard)
  findAllRoomsOnLevel(
    @Param('levelId') levelId: string,
    @Request() req: any,
    @Query('forUserId') forUserId = 0,
  ) {
    const tokenData = req.user;
    return this.buildingsService.getAllRoomsOnLevel(
      +levelId,
      tokenData.id,
      forUserId,
    );
  }

  @Post('/add-tenant-location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  async addTenantLocation(@Body() tenantLocationDto: TenantLocationDto) {
    return this.tenantLocationService.addTenantLocation(tenantLocationDto);
  }

  @Delete('/remove-tenant-location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  async removeTenantLocation(@Body() tenantLocationDto: TenantLocationDto) {
    return this.tenantLocationService.removeTenantLocation(tenantLocationDto);
  }

  @Post('/link-level-to-building')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  linkLevelToBuilding(
    @Body('buildingId') buildingId: number,
    @Body('buildingLevelId') buildingLevelId: number,
  ) {
    return this.buildingLevelsService.linkLevelToBuilding(
      buildingId,
      buildingLevelId,
    );
  }

  @Post('/unlink-level-from-building')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  unlinkLevelFromBuilding(
    @Body('buildingId') buildingId: number,
    @Body('buildingLevelId') buildingLevelId: number,
  ) {
    return this.buildingLevelsService.unlinkLevelFromBuilding(
      buildingId,
      buildingLevelId,
    );
  }

  @Post('/update-room-positions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  updateRoomPositions(@Body('items') items: any[]) {
    return this.buildingRoomsService.updateRoomPositions(items);
  }

  @Post('/update-level-positions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  updateLevelPositions(@Body('items') items: any[]) {
    return this.buildingLevelsService.updateLevelPositions(items);
  }
}
