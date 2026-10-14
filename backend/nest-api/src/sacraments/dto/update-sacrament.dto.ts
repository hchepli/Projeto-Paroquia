import { PartialType } from '@nestjs/swagger';
import { CreateSacramentDto } from './create-sacrament.dto';

export class UpdateSacramentDto extends PartialType(CreateSacramentDto) {}
