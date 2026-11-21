// Génère images/og-image.png (1200 × 630), l'aperçu affiché quand le lien du portfolio
// est partagé (LinkedIn, Slack, WhatsApp…), à partir du modèle tools/og-image.html.
// Usage : npm run og-image
// Après publication, l'inspecteur de LinkedIn (linkedin.com/post-inspector) force la
// mise à jour de l'aperçu, qu'il garde en cache.

import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(ROOT, 'tools/og-image.html')).href, { waitUntil: 'networkidle' });
// Fonction exécutée dans la page, d'où l'accès à document.
// eslint-disable-next-line no-undef
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(ROOT, 'images/og-image.png') });
await browser.close();
console.log('images/og-image.png généré.');
