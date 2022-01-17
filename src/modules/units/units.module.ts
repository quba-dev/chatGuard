import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit';

@Module({
  imports: [AppConfigModule, TypeOrmModule.forFeature([Unit])],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
