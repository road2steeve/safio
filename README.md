# SAFIO

Jeux de soirée multijoueur : un écran crée un salon, les joueurs rejoignent avec leur téléphone
(QR code ou code à 4 lettres), sans compte, dans la même pièce ou à distance.

Jeux (8) : **Quiz libre**, **Mytho !** (bluff), **Petit Bac**, **Éclair** (le plus rapide), **Même cerveau**, **C'est toi !** (votes), **Au plus près**, **Torpille** (quiz + bataille navale).
Modes : salon entre amis (QR/code), **Défi solo** avec **classement mondial**, **partie rapide en ligne** contre un inconnu.
Langues : français, anglais, espagnol (chaque joueur choisit la sienne). ~430 questions de quiz, 20 thèmes.

## Lancer sur ton ordinateur
1. Installe Node.js (version LTS) depuis https://nodejs.org
2. Dans ce dossier : `npm install` puis `npm start`
3. Ouvre http://localhost:3000

## Mettre en ligne (gratuit) avec GitHub + Render
1. Crée un compte sur https://github.com puis un dépôt vide (ex. `manette`).
2. Envoie ce dossier dans le dépôt (bouton « uploading an existing file », sans le dossier node_modules).
3. Crée un compte sur https://render.com (connexion avec GitHub).
4. New → Web Service → choisis ton dépôt.
   - Build command : `npm install`
   - Start command : `npm start`
   - Instance type : Free
5. Render te donne une adresse `https://xxx.onrender.com` : c'est ton site !

Note : sur l'offre gratuite, le serveur s'endort après ~15 min sans visite ; la première ouverture prend alors environ une minute.

## Personnaliser
- Nom affiché : `APP_NAME` en haut de `public/app.js` (+ `<title>` dans `public/index.html`)
- Logo : `public/logo.svg`
- Couleurs : variables en haut de `public/style.css`
- Questions (FR/EN/ES) : `data/questions.js`
- Textes de l'interface et nouvelles langues : `public/i18n.js`

## Classement mondial permanent (recommandé en ligne)
Sur Render gratuit, les fichiers sont effacés à chaque redémarrage, donc le classement aussi.
Pour le garder : crée une base gratuite sur https://upstash.com (Redis), puis ajoute dans Render
(Environment) les variables `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.
