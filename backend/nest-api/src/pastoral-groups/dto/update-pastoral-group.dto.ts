import { PartialType } from '@nestjs/swagger'; // mesmo motivo do UpdateRoleDto: import do swagger, não do mapped-types
import { CreatePastoralGroupDto } from './create-pastoral-group.dto';

export class UpdatePastoralGroupDto extends PartialType(CreatePastoralGroupDto) {}