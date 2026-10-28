import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReorderSacramentsDto {
  @ApiProperty({
    description: 'IDs de TODOS os sacramentos na nova ordem (posição 0 = primeiro).',
    example: [3, 1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  ids!: number[];
}
