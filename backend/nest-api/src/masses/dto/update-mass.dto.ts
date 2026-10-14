import { PartialType } from '@nestjs/swagger';
import { CreateMassDto } from './create-mass.dto';

export class UpdateMassDto extends PartialType(CreateMassDto) {}
