import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../entities/role.entity';
import { UserRole } from '../enums/user-roles.enum';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const roles = user.roles;
    let isSuperAdmin = false;
    const roleNames = roles.map((role) => {
      if (role.name === UserRole.superAdmin) isSuperAdmin = true;
      return role.name;
    });

    if (isSuperAdmin) return true;

    return requiredRoles.some((role) => roleNames?.includes(role));
  }
}
