const mysql = require('mysql2/promise');
const crypto = require('crypto');

// DB Config
const dbConfig = {
  host: '150.158.128.228',
  port: 13306,
  user: 'root',
  password: 'd06c9f4a84defd2b',
  database: 'buildadmin',
};

// Data Generators
const titles = [
  '深入理解 NestJS 模块化架构',
  '2025年前端开发趋势展望',
  'Docker 容器化部署最佳实践',
  '我的远程办公桌面配置分享',
  '如何保持高效的编程心流状态',
  'TypeORM 性能优化指南',
  'React Server Components 深度解析',
  '从零开始构建微服务架构',
  'TypeScript 高级类型体操实战',
  'WebAssembly 在现代 Web 中的应用',
  '构建可维护的大型前端项目',
  'Node.js 事件循环机制详解',
  'GraphQL vs REST: 如何选择',
  '现代 CSS 布局技巧总结',
  'Vite 构建工具原理解析',
];

const categories = [
  { name: '技术探讨', code: 'tech', colorClass: 'text-indigo-600' },
  { name: '生活杂记', code: 'life', colorClass: 'text-emerald-600' },
  { name: '设计灵感', code: 'design', colorClass: 'text-rose-600' },
  { name: '阅读随笔', code: 'reading', colorClass: 'text-amber-600' },
];

const summaries = [
  '本文深入探讨了相关技术的底层原理与应用实践，希望能给读者带来启发。',
  '分享我在实际项目中遇到的问题及解决方案，包含大量代码示例。',
  '对当前技术栈的一次全面梳理与思考，展望未来的发展方向。',
  '记录一次有趣的技术探索过程，踩坑与填坑的心得体会。',
];

const covers = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected!');

    // 1. Check/Create Users
    console.log('Checking users...');
    const [users] = await connection.execute('SELECT id FROM ra_users LIMIT 1');
    let authorId;

    if (users.length > 0) {
      authorId = users[0].id;
      console.log('Using existing user:', authorId);
    } else {
      authorId = crypto.randomUUID();
      console.log('Creating new user:', authorId);
      await connection.execute(
        `INSERT INTO ra_users (id, nickname, roles, status, createTime, updateTime) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [authorId, 'Admin User', 'system_admin', 1],
      );
    }

    // 2. Check/Create Categories
    console.log('Checking categories...');
    const [existingCats] = await connection.execute('SELECT id, code FROM ra_category');
    let categoryMap = {}; // code -> id

    // Map existing
    existingCats.forEach((c) => (categoryMap[c.code] = c.id));

    // Create missing
    for (const cat of categories) {
      if (!categoryMap[cat.code]) {
        const [res] = await connection.execute(
          `INSERT INTO ra_category (name, code, colorClass, sortOrder, createTime, updateTime) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [cat.name, cat.code, cat.colorClass, 0],
        );
        categoryMap[cat.code] = res.insertId;
        console.log(`Created category: ${cat.name}`);
      }
    }

    // 3. Insert Articles
    console.log('Inserting articles...');
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const summary = getRandom(summaries);
      const content = `# ${title}\n\n${summary}\n\n## 介绍\n\n这里是正文内容... Lorem ipsum dolor sit amet.\n\n## 总结\n\n以上就是全部内容。`;
      const cover = getRandom(covers);

      // Pick random category
      const catKeys = Object.keys(categoryMap);
      const randomCatCode = getRandom(catKeys);
      const categoryId = categoryMap[randomCatCode];

      const views = Math.floor(Math.random() * 2000);
      const isFeatured = Math.random() > 0.8 ? 1 : 0;
      const status = 'published';
      const created = randomDate(new Date(2024, 0, 1), new Date());

      await connection.execute(
        `INSERT INTO ra_article (
          title, summary, content, cover, categoryId, authorId,
          views, isFeatured, status, publishedAt, createTime, updateTime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          summary,
          content,
          cover,
          categoryId,
          authorId,
          views,
          isFeatured,
          status,
          created,
          created,
          created,
        ],
      );
      process.stdout.write('.');
    }
    console.log('\nDone! Inserted ' + titles.length + ' articles.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

seed();
