# Darwin Selection  
###### AIT-LAHCEN Hussein, GIRARD Thierry, PREVOST Mathilde, RECUERDA Maxime & ISMAIL Amine 
#
#
#### 1. Mise en place de l'environnement de développement

1. Installer NodeJS & NPM : *sudo apt-get install nodejs-legacy*
2. Installer MongoDB : *sudo apt-get install mongodb-org*
3. Récupérer le repository git : *git clone https://github.com/hussein-aitlahcen/darwin-selection.git*
4. Se placer à la racine du projet : *cd ./darwin-selection*
5.  Mettre à jour les packages avec NPM : *npm update*

#### 2. Génerer la base de données

1. Se placer dans le dossier misc : *cd ./darwin-selection/misc*
2. Créer un dossier converted : *mkdir converted*
3. Lancer le service mongod : *sudo service mongod start*
4. Remplir la base de données : *./install.sh*

#### 3. Compiler et lancer le projet

1. Se placer à la racine du projet : *cd ./darwin-selection*
2. Compiler les fichiers .jsx du dossier public : *npm run build*
3. Lancer le serveur : *nodejs game.js (ou node game.js)*
4. URL du jeu : *localhost:8080*



