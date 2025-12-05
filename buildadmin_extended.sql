-- 新增博客系统表结构（基于 DEVELOPMENT_PLAN.md 与现有 ra_* 表）
-- 数据库：MySQL/InnoDB/utf8mb4，ID 统一使用 uuid（varchar(36)）

-- ra_articles：文章主表
CREATE TABLE `ra_articles` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `id` varchar(36) NOT NULL COMMENT '文章ID',
  `author_id` varchar(36) NOT NULL COMMENT '作者用户ID（ra_users.id）',
  `editor_id` varchar(36) DEFAULT NULL COMMENT '最近编辑者用户ID（ra_users.id）',
  `title` varchar(255) NOT NULL COMMENT '文章标题',
  `slug` varchar(255) NOT NULL COMMENT '文章唯一别名（用于路由）',
  `summary` text DEFAULT NULL COMMENT '文章摘要/描述',
  `content_md` longtext NOT NULL COMMENT 'Markdown 原文内容',
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT' COMMENT '文章状态：草稿/已发布/归档',
  `visibility` enum('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC' COMMENT '可见性：公开/私密',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '发布时间（发布后填充）',
  `cover_file_id` varchar(36) DEFAULT NULL COMMENT '封面文件ID（ra_files.id）',
  `seo_title` varchar(255) DEFAULT NULL COMMENT 'SEO 标题',
  `seo_description` varchar(500) DEFAULT NULL COMMENT 'SEO 描述',
  `allow_comments` tinyint(4) NOT NULL DEFAULT '1' COMMENT '是否允许评论',
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN' COMMENT '内容语言代码',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_articles_slug` (`slug`),
  KEY `IDX_articles_author` (`author_id`),
  KEY `IDX_articles_status_published_at` (`status`,`published_at`),
  KEY `IDX_articles_cover` (`cover_file_id`),
  FULLTEXT KEY `FT_articles_title_summary_md` (`title`,`summary`,`content_md`),
  CONSTRAINT `FK_articles_author` FOREIGN KEY (`author_id`) REFERENCES `ra_users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_articles_editor` FOREIGN KEY (`editor_id`) REFERENCES `ra_users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_articles_cover_file` FOREIGN KEY (`cover_file_id`) REFERENCES `ra_files` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_tags：标签
CREATE TABLE `ra_tags` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `id` varchar(36) NOT NULL COMMENT '标签ID',
  `name` varchar(100) NOT NULL COMMENT '标签名称',
  `slug` varchar(100) NOT NULL COMMENT '标签唯一别名',
  `description` text DEFAULT NULL COMMENT '标签描述',
  `is_public` tinyint(4) NOT NULL DEFAULT '1' COMMENT '是否公开',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_tags_slug` (`slug`),
  UNIQUE KEY `UQ_tags_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_categories：分类（支持层级）
CREATE TABLE `ra_categories` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `id` varchar(36) NOT NULL COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `slug` varchar(100) NOT NULL COMMENT '分类唯一别名',
  `description` text DEFAULT NULL COMMENT '分类描述',
  `parent_id` varchar(36) DEFAULT NULL COMMENT '父分类ID（ra_categories.id）',
  `is_public` tinyint(4) NOT NULL DEFAULT '1' COMMENT '是否公开',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_categories_slug` (`slug`),
  KEY `IDX_categories_parent` (`parent_id`),
  CONSTRAINT `FK_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `ra_categories` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_article_tags：文章-标签关联（多对多）
CREATE TABLE `ra_article_tags` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `article_id` varchar(36) NOT NULL COMMENT '文章ID（ra_articles.id）',
  `tag_id` varchar(36) NOT NULL COMMENT '标签ID（ra_tags.id）',
  PRIMARY KEY (`article_id`,`tag_id`),
  KEY `IDX_article_tags_article` (`article_id`),
  KEY `IDX_article_tags_tag` (`tag_id`),
  CONSTRAINT `FK_article_tags_article` FOREIGN KEY (`article_id`) REFERENCES `ra_articles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_article_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `ra_tags` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_article_categories：文章-分类关联（多对多）
CREATE TABLE `ra_article_categories` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `article_id` varchar(36) NOT NULL COMMENT '文章ID（ra_articles.id）',
  `category_id` varchar(36) NOT NULL COMMENT '分类ID（ra_categories.id）',
  PRIMARY KEY (`article_id`,`category_id`),
  KEY `IDX_article_categories_article` (`article_id`),
  KEY `IDX_article_categories_category` (`category_id`),
  CONSTRAINT `FK_article_categories_article` FOREIGN KEY (`article_id`) REFERENCES `ra_articles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_article_categories_category` FOREIGN KEY (`category_id`) REFERENCES `ra_categories` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_comments：评论（含审核）
CREATE TABLE `ra_comments` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `id` varchar(36) NOT NULL COMMENT '评论ID',
  `article_id` varchar(36) NOT NULL COMMENT '文章ID（ra_articles.id）',
  `parent_id` varchar(36) DEFAULT NULL COMMENT '父评论ID（ra_comments.id）',
  `user_id` varchar(36) DEFAULT NULL COMMENT '评论用户ID（登录用户可为空表示游客）',
  `author_nickname` varchar(100) DEFAULT NULL COMMENT '游客昵称',
  `author_email` varchar(255) DEFAULT NULL COMMENT '游客邮箱',
  `author_website` varchar(255) DEFAULT NULL COMMENT '游客网站',
  `content` text NOT NULL COMMENT '评论内容',
  `status` enum('PENDING','APPROVED','REJECTED','DELETED') NOT NULL DEFAULT 'PENDING' COMMENT '审核状态',
  `ip_hash` varchar(64) DEFAULT NULL COMMENT 'IP 哈希（去重/风控）',
  `user_agent` varchar(255) DEFAULT NULL COMMENT '客户端 UA',
  `moderated_by_id` varchar(36) DEFAULT NULL COMMENT '审核人用户ID（ra_users.id）',
  `moderated_at` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `is_public` tinyint(4) NOT NULL DEFAULT '1' COMMENT '是否公开显示',
  PRIMARY KEY (`id`),
  KEY `IDX_comments_article_status` (`article_id`,`status`),
  KEY `IDX_comments_parent` (`parent_id`),
  KEY `IDX_comments_user` (`user_id`),
  KEY `IDX_comments_moderated_at` (`moderated_at`),
  KEY `IDX_comments_iphash` (`ip_hash`),
  CONSTRAINT `FK_comments_article` FOREIGN KEY (`article_id`) REFERENCES `ra_articles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `ra_comments` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_comments_user` FOREIGN KEY (`user_id`) REFERENCES `ra_users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_comments_moderator` FOREIGN KEY (`moderated_by_id`) REFERENCES `ra_users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_article_likes：点赞（用户或匿名，防重复）
CREATE TABLE `ra_article_likes` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `id` varchar(36) NOT NULL COMMENT '点赞记录ID',
  `article_id` varchar(36) NOT NULL COMMENT '文章ID（ra_articles.id）',
  `liked_by` enum('USER','ANON') NOT NULL DEFAULT 'USER' COMMENT '点赞主体类型：用户/匿名',
  `user_id` varchar(36) DEFAULT NULL COMMENT '用户ID（当 liked_by=USER 时必填）',
  `ip_hash` varchar(64) DEFAULT NULL COMMENT '匿名点赞 IP 哈希（当 liked_by=ANON 时必填）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_article_likes_user` (`article_id`,`user_id`),
  UNIQUE KEY `UQ_article_likes_ip` (`article_id`,`ip_hash`),
  KEY `IDX_article_likes_article` (`article_id`),
  KEY `IDX_post_likes_created` (`created_at`),
  CONSTRAINT `FK_article_likes_article` FOREIGN KEY (`article_id`) REFERENCES `ra_articles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `ra_users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_settings：站点设置（Key-Value）
CREATE TABLE `ra_settings` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `id` varchar(36) NOT NULL COMMENT '设置项ID',
  `key` varchar(100) NOT NULL COMMENT '设置项键（唯一）',
  `value` json NOT NULL COMMENT '设置项值（JSON）',
  `description` varchar(255) DEFAULT NULL COMMENT '设置项说明',
  `updated_by_id` varchar(36) DEFAULT NULL COMMENT '最后更新人（ra_users.id）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_settings_key` (`key`),
  KEY `IDX_settings_updated_by` (`updated_by_id`),
  CONSTRAINT `FK_settings_updated_by` FOREIGN KEY (`updated_by_id`) REFERENCES `ra_users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_article_revisions：文章修订记录（编辑历史）
CREATE TABLE `ra_article_revisions` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `id` varchar(36) NOT NULL COMMENT '修订记录ID',
  `article_id` varchar(36) NNOT ULL COMMENT '文章ID（ra_articles.id）',
  `editor_id` varchar(36) NOT NULL COMMENT '编辑者ID（ra_users.id）',
  `title` varchar(255) NOT NULL COMMENT '修订标题',
  `summary` text DEFAULT NULL COMMENT '修订摘要',
  `content_md` longtext NOT NULL COMMENT '修订时的 Markdown 内容',
  `reason` varchar(255) DEFAULT NULL COMMENT '修订原因',
  PRIMARY KEY (`id`),
  KEY `IDX_article_revisions_article` (`article_id`),
  KEY `IDX_post_revisions_editor` (`editor_id`),
  CONSTRAINT `FK_article_revisions_article` FOREIGN KEY (`article_id`) REFERENCES `ra_articles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_post_revisions_editor` FOREIGN KEY (`editor_id`) REFERENCES `ra_users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ra_article_files：文章-文件关联（封面/内嵌附件等）
CREATE TABLE `ra_article_files` (
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `article_id` varchar(36) NOT NULL COMMENT '文章ID（ra_articles.id）',
  `file_id` varchar(36) NOT NULL COMMENT '文件ID（ra_files.id）',
  `description` varchar(255) DEFAULT NULL COMMENT '文件用途说明',
  PRIMARY KEY (`article_id`,`file_id`),
  KEY `IDX_article_files_article` (`article_id`),
  KEY `IDX_post_files_file` (`file_id`),
  CONSTRAINT `FK_article_files_article` FOREIGN KEY (`article_id`) REFERENCES `ra_articles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_post_files_file` FOREIGN KEY (`file_id`) REFERENCES `ra_files` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
