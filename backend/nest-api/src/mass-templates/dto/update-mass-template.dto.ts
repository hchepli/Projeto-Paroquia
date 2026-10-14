import { PartialType } from '@nestjs/swagger';
import { CreateMassTemplateDto } from './create-mass-template.dto';

export class UpdateMassTemplateDto extends PartialType(CreateMassTemplateDto) {}