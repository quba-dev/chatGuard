import { createHash } from 'crypto';
import { Project } from '../modules/projects/entities/project.entity';

export const md5Hash = (text: string) => {
  return createHash('md5').update(text).digest('hex');
};

export const sanitizeWithRelations = (
  allowed: string[],
  withRelations: string,
) => {
  if (withRelations == 'all') return allowed;

  const withRelationsArray = withRelations.split(',');
  const result = [];
  for (const item of withRelationsArray) {
    if (allowed.indexOf(item) > -1) {
      result.push(item);
    }
  }
  return result;
};

export const checkForPresenceInProjectList = (
  projectId: number,
  projects: Project[],
) => {
  let found = false;
  for (const project of projects) {
    if (project.id == projectId) {
      found = true;
      break;
    }
  }
  return found;
};
