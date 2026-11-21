// Point d'entrée : branche chaque comportement sur la page. Le routeur démarre en dernier,
// une fois les blocs enrichis (bandeaux, aperçus, schémas) construits.
import { initDiagrams } from './modules/diagrams.js';
import { initDisclosures } from './modules/disclosure.js';
import { initMenu } from './modules/menu.js';
import { initPreviews } from './modules/previews.js';
import { initProjects } from './modules/projects.js';
import { initReels } from './modules/reels.js';
import { initRouter } from './modules/router.js';
import { initTabs } from './modules/tabs.js';
import { initTheme } from './modules/theme.js';
import { createTyping } from './modules/typing.js';

const byId = (id) => document.getElementById(id);

initTheme(byId('themeToggle'), byId('themeLabel'));
const menu = initMenu({ burger: byId('burger'), panels: [byId('mainNav'), byId('sidebarBottom')] });
const typing = createTyping(byId('typedTitle'), byId('typedPara'));

initTabs();
initDiagrams();
initPreviews();
initReels();
initDisclosures();

initRouter({ projects: initProjects(), menu, typing });
