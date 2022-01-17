import { BadRequestException } from '@nestjs/common';
import { Project } from '../modules/projects/entities/project.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/authentication/entities/role.entity';
import { UserRole } from '../modules/authentication/enums/user-roles.enum';

export const checkForRole = (role: UserRole, roles: Role[]) => {
  for (const roleAllocated of roles) {
    if (roleAllocated.name === role) return true;
  }
  return false;
};

export const checkForRoles = (rolesToCheck: UserRole[], roles: Role[]) => {
  for (const roleAllocated of rolesToCheck) {
    if (checkForRole(roleAllocated, roles)) return true;
  }
  return false;
};

export const checkIfUserHasAccessToProject = (
  user: User,
  projectId: number,
  organizationProjects: Project[],
) => {
  if (!user.projects)
    throw new BadRequestException(
      'checkIfUserHasAccessToProject: the user object needs to include projects',
    );
  if (!user.roles)
    throw new BadRequestException(
      'checkIfUserHasAccessToProject: the user object needs to include roles',
    );

  let userCanUpdateProject = false;
  if (checkForRole(UserRole.superAdmin, user.roles)) {
    userCanUpdateProject = true;
  } else {
    if (checkForRole(UserRole.admin, user.roles)) {
      if (!organizationProjects)
        throw new BadRequestException(
          'checkIfUserHasAccessToProject: for an user with admin role you need to include organizationProjects',
        );

      const projectIndex = organizationProjects.findIndex(
        (project) => project.id === projectId,
      );
      if (projectIndex != -1) userCanUpdateProject = true;
    } else {
      const projectIndex = user.projects.findIndex(
        (project) => project.id === projectId,
      );
      if (projectIndex != -1) userCanUpdateProject = true;
    }
  }

  return userCanUpdateProject;
};
