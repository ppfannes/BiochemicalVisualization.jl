# Bachelor Thesis

This is where important information and progress regarding my project will go.

> ### Installation
> You need to make sure you have the latest version of [node.js](https://nodejs.org/en/download/) installed. \
> The main component of the project is a visualization library called [three.js](https://threejs.org/). All libraries
> used by the project are managed via the [npm package manager](https://www.npmjs.com/). Install them by executing the following commands: 
> ```bash
> > cd bachelor_thesis/src/MoleculeVisualizer
> > npm install
> ```
 
> ### Usage
> MoleculeVisualizer is built as a single page application, so you need to run a local webserver in order to use it.
> The simplest solution is to use the [serve package](https://www.npmjs.com/package/serve) from npm by running the following
> inside the MoleculeVisualizer directory:
> ```bash
> > npx serve
> ```
> After executing this command, copy the URL that shows up in the CLI into your browser and the MoleculeVisualizer
> should start up.

> ### Priority List
>1. Grundlegende Visualisierungen: VdW (also nur Kugeln), Ball and Stick (Kugeln und Zylinder), Wireframe
>
>2. Verwendung über wie auch immer geartete API (damit wir es mit Daten füttern können)
>
>3. Möglichkeit, Meshes zu visualisieren
>
>4. Möglichkeit, Text-Label zu plazieren
>
>5. Stereo-Visualisierung
>
>6. Interaktionsmöglichkeiten (im Moment reicht es, die in der API zu haben, so dass man sich da später einhängen kann)
>
>7. Unterschiedliche Rendering-Möglichkeiten (Clipping, Capping, Transparenz, unterschiedliche Färbungen)
>
>8. Komplexere Visualisierungen (Ribbon-Modelle, Secondary Structure, SES, SAS, …) -> Würde erstmal durch Meshes abgedeckt


> ### Current Feature ToDo list
> 1. Add API for integration into Julia-BALL

> ### Current bug list
> None

> ## License
> [MIT](https://choosealicense.com/licenses/mit/)