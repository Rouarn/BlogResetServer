#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { log, showBanner, showSuccess, separator, handleError } = require('@vakao-ui/scripts-utils');
const readline = require('readline');

function toPascalCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (m) => m.toUpperCase());
}

function toSingular(name) {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('ses')) return name.slice(0, -2);
  if (name.endsWith('s')) return name.slice(0, -1);
  return name;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  log(`✅ 创建文件: ${path.relative(process.cwd(), filePath)}`, 'success');
}

function genTemplates(resourceRaw) {
  const resource = resourceRaw.toLowerCase();
  const singular = toSingular(resource);
  const PascalPlural = toPascalCase(resource);
  const PascalSingular = toPascalCase(singular);

  const entity = `import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/database';

@Entity('ra_${resource}')
export class ${PascalSingular} extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ length: 100, nullable: true, comment: '名称' })
  name: string;
}
`;

  const dtoCreate = `import { IsOptional, IsString } from 'class-validator';

export class Create${PascalSingular}Dto {
  @IsOptional()
  @IsString()
  name?: string;
}
`;

  const dtoUpdate = `import { PartialType } from '@nestjs/swagger';
import { Create${PascalSingular}Dto } from './create-${singular}.dto';

export class Update${PascalSingular}Dto extends PartialType(Create${PascalSingular}Dto) {}
`;

  const dtoQuery = `import { IsOptional, IsInt, Min } from 'class-validator';

export class Query${PascalSingular}Dto {
  @IsOptional()
  @IsInt()
  @Min(1)
  current?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;
}
`;

  const dtoDelete = `import { IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class Delete${PascalSingular}Dto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  ids?: string[];
}
`;

  const service = `import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Cache, CacheEvict, ICacheService } from '@/shared/cache';
import { CACHE_TOKENS } from '@/common/constants';
import type { Create${PascalSingular}Dto } from './dto/create-${singular}.dto';
import type { Update${PascalSingular}Dto } from './dto/update-${singular}.dto';
import type { Delete${PascalSingular}Dto } from './dto/delete-${singular}.dto';
import { ${PascalSingular} } from './entities/${singular}.entity';

@Injectable()
export class ${PascalPlural}Service {
  constructor(
    @InjectRepository(${PascalSingular})
    private readonly repo: Repository<${PascalSingular}>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: Create${PascalSingular}Dto): Promise<void> {
    const entity = this.repo.create(dto as ${PascalSingular});
    await this.repo.save(entity);
    return;
  }

  @Cache({ key: '${resource}:list:page:\${0}:size:\${1}' })
  async findAll(current: number = 1, size: number = 10): Promise<{ data: ${PascalSingular}[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { createTime: 'DESC' },
    });
    return { data, total };
  }

  @Cache({ key: '${resource}:item:\${0}' })
  async findById(id: string): Promise<${PascalSingular}> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('${PascalSingular}', { id });
    }
    return entity;
  }

  @CacheEvict({ keys: ['${resource}:item:\${0}', '${resource}:list:*'] })
  async update(id: string, dto: Update${PascalSingular}Dto): Promise<void> {
    const entity = await this.findById(id);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return;
  }

  @CacheEvict({ keys: ['${resource}:item:*', '${resource}:list:*'] })
  async remove(dto: Delete${PascalSingular}Dto): Promise<{ message: string; deletedCount: number }> {
    if (dto.id) {
      const entity = await this.findById(dto.id);
      await this.repo.remove(entity);
      return { message: '删除成功', deletedCount: 1 };
    }
    if (dto.ids?.length) {
      const list = await this.repo.findBy({ id: In(dto.ids) });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { ids: dto.ids });
      }
      await this.repo.remove(list);
      return { message: \`成功删除 \${list.length} 条记录\`, deletedCount: list.length };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数');
  }
}
`;

  const controller = `import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ${PascalPlural}Service } from './${resource}.service';
import { ${PascalSingular} } from './entities/${singular}.entity';
import { Create${PascalSingular}Dto } from './dto/create-${singular}.dto';
import { Update${PascalSingular}Dto } from './dto/update-${singular}.dto';
import { Query${PascalSingular}Dto } from './dto/query-${singular}.dto';
import { Delete${PascalSingular}Dto } from './dto/delete-${singular}.dto';

@ApiTags('${PascalPlural}管理')
@ApiBearerAuth()
@Controller('${resource}')
export class ${PascalPlural}Controller {
  constructor(private readonly service: ${PascalPlural}Service) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiResponse({ status: 201, type: ${PascalSingular} })
  async create(@Body() dto: Create${PascalSingular}Dto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: Query${PascalSingular}Dto): Promise<{ data: ${PascalSingular}[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<${PascalSingular}> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: Update${PascalSingular}Dto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: Delete${PascalSingular}Dto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
`;

  const module = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ${PascalPlural}Controller } from './${resource}.controller';
import { ${PascalPlural}Service } from './${resource}.service';
import { ${PascalSingular} } from './entities/${singular}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${PascalSingular}]), CacheModule],
  controllers: [${PascalPlural}Controller],
  providers: [${PascalPlural}Service],
  exports: [${PascalPlural}Service, TypeOrmModule],
})
export class ${PascalPlural}Module {}
`;

  return { entity, dtoCreate, dtoUpdate, dtoQuery, dtoDelete, service, controller, module };
}

function generate(resource) {
  showBanner('生成基础CRUD资源');
  separator('─', 50);

  const root = path.resolve(__dirname, '..');
  const baseDir = path.join(root, 'src', 'modules', resource.toLowerCase());
  const dtoDir = path.join(baseDir, 'dto');
  const entitiesDir = path.join(baseDir, 'entities');

  if (fs.existsSync(baseDir)) {
    log('⚠️  目标模块目录已存在，已跳过创建', 'warning');
    return;
  }

  ensureDir(dtoDir);
  ensureDir(entitiesDir);

  const t = genTemplates(resource);

  writeFile(path.join(entitiesDir, `${toSingular(resource)}.entity.ts`), t.entity);
  writeFile(path.join(dtoDir, `create-${toSingular(resource)}.dto.ts`), t.dtoCreate);
  writeFile(path.join(dtoDir, `update-${toSingular(resource)}.dto.ts`), t.dtoUpdate);
  writeFile(path.join(dtoDir, `query-${toSingular(resource)}.dto.ts`), t.dtoQuery);
  writeFile(path.join(dtoDir, `delete-${toSingular(resource)}.dto.ts`), t.dtoDelete);
  writeFile(path.join(baseDir, `${resource}.service.ts`), t.service);
  writeFile(path.join(baseDir, `${resource}.controller.ts`), t.controller);
  writeFile(path.join(baseDir, `${resource}.module.ts`), t.module);

  showSuccess('🎉 资源生成完成');
}

function main() {
  const [, , nameArg] = process.argv;
  if (nameArg) {
    generate(nameArg);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('请输入资源名称 (例如: posts): ', (answer) => {
    const name = String(answer || '').trim();
    if (!name) {
      log('❌ 资源名称不能为空', 'error');
      rl.close();
      process.exit(1);
    }
    rl.close();
    generate(name);
  });
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    handleError('生成资源失败', err);
    process.exit(1);
  }
}

module.exports = { generate };
