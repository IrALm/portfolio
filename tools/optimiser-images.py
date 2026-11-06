"""Génère les versions WebP allégées des captures du portfolio.

Pour chaque image source, deux versions sont écrites :
  images/thumbs/<chemin>.webp  miniature de 440 px de haut (bandeau défilant, 220 px affichés en écran Retina)
  images/web/<chemin>.webp     version de 1000 px de large au plus (galerie et images dans la page)

Les originaux ne sont pas modifiés : ils restent la cible du clic « ouvrir en grand ».
Une image déjà convertie et plus récente que sa source est ignorée.

Usage (depuis la racine du portfolio) :
    python tools/optimiser-images.py
"""
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parent.parent / "images"
DOSSIERS = ["kupanga", "kitchup"]          # captures des projets (toutes les images du dossier)
FICHIERS = ["aws-dashboard-charge.png", "aws-interface.png"]
EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Recadrages carrés : source -> (nom de sortie dans images/web, zone (gauche, haut, droite, bas), côté en px)
RECADRAGES = {
    "profilGithub.jpg": ("profilGithub-portrait", (265, 670, 645, 1050), 320),  # buste, page Stack
}

MINIATURE_HAUTEUR = 440
WEB_LARGEUR = 1000
QUALITE = {"thumbs": 72, "web": 80}


def a_jour(source: Path, cible: Path) -> bool:
    return cible.exists() and cible.stat().st_mtime >= source.stat().st_mtime


def ecrire(image: Image.Image, cible: Path, qualite: int) -> int:
    cible.parent.mkdir(parents=True, exist_ok=True)
    image.save(cible, "WEBP", quality=qualite, method=6)
    return cible.stat().st_size


def convertir(source: Path) -> tuple[int, int, int]:
    relatif = source.relative_to(RACINE).with_suffix(".webp")
    miniature = RACINE / "thumbs" / relatif
    web = RACINE / "web" / relatif
    if a_jour(source, miniature) and a_jour(source, web):
        return 0, 0, 0

    with Image.open(source) as im:
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        largeur, hauteur = im.size

        h = min(MINIATURE_HAUTEUR, hauteur)
        petite = im.resize((round(largeur * h / hauteur), h), Image.LANCZOS)
        poids_mini = ecrire(petite, miniature, QUALITE["thumbs"])

        l = min(WEB_LARGEUR, largeur)
        moyenne = im.resize((l, round(hauteur * l / largeur)), Image.LANCZOS)
        poids_web = ecrire(moyenne, web, QUALITE["web"])

    return source.stat().st_size, poids_mini, poids_web


def main() -> None:
    sources = [p for d in DOSSIERS for p in sorted((RACINE / d).iterdir()) if p.suffix.lower() in EXTENSIONS]
    sources += [RACINE / f for f in FICHIERS if (RACINE / f).exists()]

    total = [0, 0, 0]
    convertis = 0
    for source in sources:
        poids = convertir(source)
        if poids[0]:
            convertis += 1
            total = [t + p for t, p in zip(total, poids)]

    for nom, (sortie, zone, cote) in RECADRAGES.items():
        source = RACINE / nom
        cible = RACINE / "web" / f"{sortie}.webp"
        if source.exists() and not a_jour(source, cible):
            with Image.open(source) as im:
                carre = im.convert("RGB").crop(zone).resize((cote, cote), Image.LANCZOS)
                ecrire(carre, cible, QUALITE["web"])
            print(f"recadrage {cible.relative_to(RACINE)}")

    print(f"{convertis} image(s) convertie(s) sur {len(sources)}")
    if convertis:
        mo = lambda o: f"{o / 1e6:.1f} Mo"
        print(f"originaux {mo(total[0])} -> miniatures {mo(total[1])}, versions web {mo(total[2])}")


if __name__ == "__main__":
    main()
