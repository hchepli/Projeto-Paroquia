// src/masses/dto/link-pastoral-groups.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class LinkPastoralGroupsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description: 'IDs das Pastorais a vincular (substitui o vínculo atual)',
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsInt({ each: true })
  pastoralGroupIds!: number[];
}