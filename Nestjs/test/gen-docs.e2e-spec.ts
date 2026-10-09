import { RequestMethod } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { IS_PUBLIC, PERMISSIONS_KEY } from '../src/common/decorators/auth.decorators';
import { PrismaService } from '../src/prisma/prisma.service';
import { ROLE_PERMISSIONS } from '../src/auth/permissions';

/** Generates docs/API.md and docs/PERMISSIONS.md from the live route table. Run: npm run docs:api */
const run = process.env.GEN_DOCS === '1' ? describe : describe.skip;

run('generate API docs', () => {
  it('writes docs/API.md and docs/PERMISSIONS.md', async () => {
    const stub = new Proxy({}, { get: (_t, p) => (p === 'then' ? undefined : new Proxy(() => undefined, { get: () => jest.fn() })) });
    const mod = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(stub).compile();
    const app = mod.createNestApplication();
    await app.init();
    const container = app.get(ModulesContainer);
    const rows: { group: string; method: string; path: string; access: string }[] = [];
    const clean = (p: string) => '/' + p.split('/').filter(Boolean).join('/');
    for (const m of container.values()) {
      for (const w of m.controllers.values()) {
        const ctrl = w.metatype as (new () => object) | null;
        if (!ctrl) continue;
        const base = Reflect.getMetadata('path', ctrl) as string | string[] | undefined;
        if (base === undefined) continue;
        const basePath = Array.isArray(base) ? base[0] : base;
        const proto = ctrl.prototype as Record<string, unknown>;
        for (const name of Object.getOwnPropertyNames(proto)) {
          const h = proto[name];
          if (typeof h !== 'function' || name === 'constructor') continue;
          const method = Reflect.getMetadata('method', h) as number | undefined;
          if (method === undefined) continue;
          const sub = (Reflect.getMetadata('path', h) as string | string[]) ?? '';
          const subPath = Array.isArray(sub) ? sub[0] : sub;
          const pub = Reflect.getMetadata(IS_PUBLIC, h) ?? Reflect.getMetadata(IS_PUBLIC, ctrl);
          const perms = (Reflect.getMetadata(PERMISSIONS_KEY, h) ?? Reflect.getMetadata(PERMISSIONS_KEY, ctrl)) as string[] | undefined;
          const prefix = ['health', 'health/ready'].includes(clean(`${basePath}/${subPath}`).slice(1)) ? '' : '/api/v1';
          rows.push({
            group: ctrl.name.replace(/Controller$/, ''),
            method: RequestMethod[method],
            path: prefix + clean(`${basePath}/${subPath}`),
            access: pub ? 'public' : perms?.length ? perms.map((p) => `\`${p}\``).join(', ') : 'authenticated',
          });
        }
      }
    }
    rows.sort((a, b) => a.group.localeCompare(b.group) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
    let md = `# API reference\n\n> Generated from the live route table (\`npm run docs:api\`). Interactive docs: \`/docs\` (Swagger, non-production).\n\n`;
    md += `All routes are under \`/api/v1\` (health probes excluded). Responses use the envelope \`{ success, data, meta?, timestamp, requestId }\`; errors use \`{ success:false, statusCode, message, errorCode, timestamp, requestId }\`.\n`;
    md += `Auth: \`Authorization: Bearer <access token>\`. "authenticated" means any logged-in user (row-level scope still applies).\n\n`;
    md += `**${rows.length} endpoints**\n\n`;
    let g = '';
    for (const r of rows) {
      if (r.group !== g) {
        g = r.group;
        md += `\n## ${g}\n\n| Method | Path | Access |\n|---|---|---|\n`;
      }
      md += `| ${r.method} | \`${r.path}\` | ${r.access} |\n`;
    }
    writeFileSync(join(__dirname, '../docs/API.md'), md);

    let pm = `# Roles & permissions\n\n> Generated from \`src/auth/permissions.ts\` (\`npm run docs:api\`). Permissions gate the action; row-level scope (own section, own department, own child) is applied on top by \`AccessService\`.\n\n`;
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS as Record<string, readonly string[] | string>)) {
      const list = Array.isArray(perms) ? perms : [String(perms)];
      pm += `## ${role}\n\n${list.length} permissions\n\n${list.map((p) => `\`${p}\``).join(' · ')}\n\n`;
    }
    writeFileSync(join(__dirname, '../docs/PERMISSIONS.md'), pm);
    await app.close();
  }, 60000);
});
