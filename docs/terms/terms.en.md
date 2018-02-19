# Terminology

* **A bundle** is a file received as a result of building the source files of the project.
For example, the result of building CSS files spread out across the project's file system can be the `project.css` bundle. JavaScript files can be built into the `project.js` bundle.

* **A masked target** is a target name that can contain ` ? `. The `? character` is replaced with the node name when the technology is tuned.

   You can use the `{lang}` substring to create several copies of the technology for each language. In each copy, `{lang}` will be replaced with the language abbreviation.

   For example, `?.js` is replaced with `search.js` if the node is `pages/search`. This approach is useful for configuring multiple nodes via `nodeMask`.

* **A make file** is a file that configures ENB for the project build. It is located in the `<project_root>/.enb/make.js` folder.

* **A node** is a directory where targets are located. For example: `pages/index`.

* **The suffix** is the extension of the source or destination file. For example: `js`.

* **The target** is the build target. For example: `index.js` can be a target within the `pages/index` node.
