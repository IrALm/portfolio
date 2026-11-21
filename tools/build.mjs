// Assemble index.html à partir des sources de src/.
//
//   src/layout.html          squelette de la page (<head>, barre latérale, <main>)
//   src/pages/<vue>.html     une vue par fichier, insérée par <!-- @include pages/<vue>.html -->
//   src/projets/NN-<slug>.html
//                            un projet par fichier, dans l'ordre du préfixe NN ; chaque fichier
//                            commence par <div class="project-page" data-project="…" data-label="…">
//
// La barre des projets (<!-- @projets-nav -->) est générée depuis ces fichiers : ajouter un
// projet revient à déposer un fichier dans src/projets/ puis à relancer le build.
//
// Usage :  node tools/build.mjs           écrit index.html
//          node tools/build.mjs --check   échoue si index.html n'est pas à jour (CI)

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUTPUT = join(ROOT, 'index.html');

const read = (path) => readFileSync(join(SRC, path), 'utf8');

function loadProjects() {
  return readdirSync(join(SRC, 'projets'))
    .filter((name) => /^\d+-[\w-]+\.html$/.test(name))
    .sort()
    .map((name, index) => {
      const html = read(join('projets', name));
      const root = html.match(/^\s*<div class="project-page"[^>]*>/);
      const slug = root && root[0].match(/data-project="([^"]+)"/);
      const label = root && root[0].match(/data-label="([^"]+)"/);
      if (!slug || !label) {
        throw new Error(
          `src/projets/${name} : le fichier doit commencer par <div class="project-page" data-project="…" data-label="…">`,
        );
      }
      return { slug: slug[1], label: label[1], number: String(index + 1).padStart(2, '0'), html };
    });
}

function navLink({ slug, label, number }) {
  return (
    `<a href="#projets/${slug}" class="project-nav-link" data-project="${slug}">` +
    `<span class="project-nav-num">${number}</span><span class="project-nav-name">${label}</span></a>`
  );
}

// Remplace chaque ligne-directive <!-- @nom argument --> par le texte fourni, en gardant
// l'indentation de la directive pour les contenus générés.
function expand(template, directives) {
  return template.replace(/^([ \t]*)<!-- @([\w-]+)(?: ([^ ]+))? -->\r?\n/gm, (_, indent, name, arg) => {
    const handler = directives[name];
    if (!handler) throw new Error(`Directive inconnue : @${name}`);
    return handler(arg, indent);
  });
}

export function build() {
  const projects = loadProjects();
  const slugs = projects.map((p) => p.slug);
  const duplicate = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (duplicate) throw new Error(`Deux projets portent le même data-project : ${duplicate}`);

  const directives = {
    generated: (_, indent) =>
      `${indent}<!-- Fichier généré par tools/build.mjs : modifier src/ puis lancer « npm run build ». -->\n`,
    include: (path) => expand(read(path), directives),
    'projets-nav': (_, indent) => projects.map((p) => indent + navLink(p) + '\n').join(''),
    'projets-pages': () => projects.map((p) => p.html).join('\n'),
  };
  return expand(read('layout.html'), directives);
}

const html = build();

if (process.argv.includes('--check')) {
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
  if (current !== html) {
    console.error('index.html n’est pas à jour : lancez « npm run build ».');
    process.exit(1);
  }
  console.log('index.html est à jour.');
} else {
  writeFileSync(OUTPUT, html);
  console.log('index.html généré depuis src/.');
}
