// src/mass-templates/dto/update-mass-template.dto.ts
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMassTemplateDto } from './create-mass-template.dto';

// dayOfWeek/time não mudam: alterar geraria duplicatas. Para mudar, crie outro template e desative este.
export class UpdateMassTemplateDto extends OmitType(
  PartialType(CreateMassTemplateDto),
  ['dayOfWeek', 'time'] as const,
) {}
