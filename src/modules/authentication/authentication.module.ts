import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { configValues } from '../configuration';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesController } from './roles.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    AppConfigModule,
    JwtModule.register({
      secret: configValues.jwt.jwtSecret,
      signOptions: { expiresIn: '3600s' },
    }),
    TypeOrmModule.forFeature([Role]),
  ],
  controllers: [AuthenticationController, RolesController],
  exports: [RolesService],
  providers: [AuthenticationService, LocalStrategy, JwtStrategy, RolesService],
})
export class AuthenticationModule {}
