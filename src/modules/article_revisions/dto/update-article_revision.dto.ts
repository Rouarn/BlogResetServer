import { PartialType } from '@nestjs/swagger';
import { CreateArticleRevisionDto } from './create-article_revision.dto';

export class UpdateArticleRevisionDto extends PartialType(CreateArticleRevisionDto) {}
