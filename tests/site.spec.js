import { expect, test } from '@playwright/test';

const VIEWS = ['accueil', 'parcours', 'projets', 'stack', 'contact'];
const PROJECTS = ['kupanga', 'kitchup', 'aws', 'autres'];
const isMobile = (testInfo) => testInfo.project.name === 'mobile';

// Les ressources externes (polices, YouTube, icônes) ne sont pas testées : seul le site compte.
function collectProblems(page) {
  const problems = [];
  page.on('pageerror', (error) => problems.push(`erreur JS : ${error.message}`));
  page.on('response', (response) => {
    if (response.url().startsWith('http://localhost') && response.status() >= 400) {
      problems.push(`${response.status()} ${response.url()}`);
    }
  });
  return problems;
}

const activeView = (page) => page.locator('.view.active');

test.describe('chargement', () => {
  for (const hash of [...VIEWS, ...PROJECTS.map((p) => `projets/${p}`)]) {
    test(`#${hash} s'affiche sans erreur ni ressource manquante`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(`/#${hash}`);
      await expect(activeView(page)).toHaveAttribute('data-view', hash.split('/')[0]);
      await page.waitForLoadState('load');
      expect(problems).toEqual([]);
    });
  }

  test('le titre d’accueil est dans le HTML, lisible sans JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#typedTitle')).toHaveText('Je conçois des systèmes back-end faits pour durer.');
    await expect(page.locator('#typedPara')).toContainText('Mastère Architecture des Logiciels');
    await context.close();
  });

  test('l’animation d’accueil réécrit le texte complet', async ({ page }) => {
    await page.goto('/#accueil');
    await expect(page.locator('#typedTitle')).toBeVisible();
    await expect(page.locator('#typedTitle .typed-text')).toHaveText(
      'Je conçois des systèmes back-end faits pour durer.',
    );
  });
});

test.describe('navigation', () => {
  test('les liens du menu changent de vue et d’ancre', async ({ page }, testInfo) => {
    await page.goto('/#accueil');
    for (const view of ['parcours', 'stack', 'contact', 'accueil']) {
      if (isMobile(testInfo)) await page.locator('#burger').click();
      await page.locator(`.nav-link[data-page="${view}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${view}$`));
      await expect(activeView(page)).toHaveAttribute('data-view', view);
      await expect(page.locator(`.nav-link[data-page="${view}"]`)).toHaveClass(/active/);
    }
  });

  test('sans ancre, la dernière vue consultée est rouverte', async ({ page }) => {
    await page.goto('/#stack');
    await page.goto('/');
    await expect(page).toHaveURL(/#stack$/);
    await expect(activeView(page)).toHaveAttribute('data-view', 'stack');
  });

  test('une ancre inconnue garde la vue courante', async ({ page }) => {
    await page.goto('/#parcours');
    await page.evaluate(() => (location.hash = 'nimporte-quoi'));
    await expect(activeView(page)).toHaveAttribute('data-view', 'parcours');
  });
});

test.describe('projets', () => {
  test('la barre des projets est générée depuis src/projets, dans l’ordre', async ({ page }) => {
    await page.goto('/#projets');
    const links = page.locator('.project-nav-link');
    await expect(links).toHaveCount(PROJECTS.length);
    for (const [i, slug] of PROJECTS.entries()) {
      await expect(links.nth(i)).toHaveAttribute('data-project', slug);
      await expect(links.nth(i).locator('.project-nav-num')).toHaveText(String(i + 1).padStart(2, '0'));
    }
  });

  test('#projets sans projet ouvre le premier et réécrit l’ancre', async ({ page }) => {
    await page.goto('/#projets');
    await expect(page).toHaveURL(/#projets\/kupanga$/);
    await expect(page.locator('.project-page[data-project="kupanga"]')).toBeVisible();
  });

  test('un lien direct ouvre le bon projet, avec précédent / suivant', async ({ page }) => {
    await page.goto('/#projets/kitchup');
    await expect(page.locator('.project-page:visible')).toHaveAttribute('data-project', 'kitchup');
    await expect(page.locator('.project-nav-link[aria-current="page"]')).toHaveAttribute('data-project', 'kitchup');
    await expect(page.locator('#projectCount')).toHaveText('2 / 4');
    await expect(page.locator('#projectPrev .project-pager-name')).toHaveText('Kupanga');
    await expect(page.locator('#projectNext .project-pager-name')).toHaveText('Dossiers étudiants sur AWS');
  });

  test('« Projet suivant » passe au projet suivant ; le dernier n’a pas de suivant', async ({ page }) => {
    await page.goto('/#projets/aws');
    await page.locator('#projectNext').click();
    await expect(page).toHaveURL(/#projets\/autres$/);
    await expect(page.locator('.project-page:visible')).toHaveAttribute('data-project', 'autres');
    await expect(page.locator('#projectNext')).toBeHidden();
  });

  test('« Lire la suite » déplie puis replie un bloc de texte', async ({ page }) => {
    await page.goto('/#projets/kupanga');
    const toggle = page.locator('.project-page:visible .preview-toggle:visible').first();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveText('Réduire ↑');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('« Tout afficher » remplace le bandeau de captures par la galerie', async ({ page }) => {
    await page.goto('/#projets/kitchup');
    const toggle = page.locator('.project-page:visible .reel-toggle').first();
    const reel = page.locator('.project-page:visible .reel').first();
    await expect(reel).toBeVisible();
    await toggle.click();
    await expect(reel).toBeHidden();
    await expect(page.locator('.project-page:visible .gallery-full').first()).toBeVisible();
  });

  test('les onglets se pilotent au clavier', async ({ page }) => {
    await page.goto('/#projets/aws');
    const tabs = page.locator('.project-page:visible [role="tablist"]').first().locator('[role="tab"]');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('préférences', () => {
  test('le thème bascule et reste choisi après rechargement', async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/#contact');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    if (isMobile(testInfo)) await page.locator('#burger').click();
    await page.locator('#themeToggle').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#themeLabel')).toHaveText('Mode clair');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('le menu mobile s’ouvre et se referme après navigation', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'menu burger : mobile uniquement');
    await page.goto('/#accueil');
    const burger = page.locator('#burger');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mainNav')).toHaveClass(/open/);
    await page.locator('.nav-link[data-page="contact"]').click();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });
});
