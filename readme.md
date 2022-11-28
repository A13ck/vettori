# Vettori 3D

This is a little visualizer of two 3D vectors and the results of their sum, subtraction, cross product and dot product using THREE.JS with perspective camera. The components of the two operand vectors can range between -3 and 3; the resulting vectors update dinamically when the operands change.

## Installazione semplice
1. Scarica il sorgente in formato zip in una cartella
2. Apri la cartella con VSCODE
3. Apri il terminale di VSCODE ed esegui "nmp install"
4. Esegui "npm run dev"
5. Ora le modifiche al codice si eseguiranno automaticamente al salvataggio dei file (in caso di blocco di questa funzionalità, aggiorna la pagina).

## Setup con account github

1. Scarica ed installa [Node.js 18.12.1 LTS](https://nodejs.org/en/).
2. Scarica ed installa [Git](https://git-scm.com/download/win).
3. Crea un tuo account su github, se non ce l'hai.
4. Esegui il fork del progetto bvicini/vettori.
5. Clona il progetto sul tuo computer con git clone
6. Aprendo la cartella con vscode la parte Source Control (Git integrato) sarà attiva

7. Per eseguire il codice in un server locale:
   * Esegui "**npm install**" nella cartella del progetto (scaricherà tutte le dependencies in /node_modules)
   * Esegui "**npn run dev**" per avviare il sito sul server locale
   * Con "**npm run build**" viene prodotta la versione compattata eseguibile online nella cartella /dist
