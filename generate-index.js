const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "docs");
const outputFile = path.join(__dirname, "index.html");

function scanDir(dir, basePath = "/docs") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = entries.map((entry) => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      return {
        name: entry.name,
        type: "directory",
        children: scanDir(fullPath, relativePath),
      };
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      return {
        name: entry.name,
        type: "file",
        path: relativePath,
      };
    }
    return null;
  });

  return result.filter((entry) => entry !== null);
}

function generateHTML(tree) {
  const generateList = (items) =>
    items
      .map((item) => {
        if (item.type === "directory") {
          return `
<li class="dropdown">
  <span class="dropdown-toggle">
    <span class="dropdown-icon">▼</span> ${item.name}
  </span>
  <ul class="dropdown-menu">
    ${generateList(item.children)}
  </ul>
</li>`;
        } else {
          return `<li><a target="_blank" href="${item.path}">${item.name}</a></li>`;
        }
      })
      .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <title>Documentation</title>
</head>
<body>
  <div class="container">
    <h1>Documentation</h1>
    <ul>
      ${generateList(tree)}
    </ul>
  </div>
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
        toggle.addEventListener("click", () => {
          const parent = toggle.parentElement;
          parent.classList.toggle("open");
        });
      });
    });
  </script>
</body>
</html>
  `;

  return html;
}

const docsTree = scanDir(docsDir);
const htmlContent = generateHTML(docsTree);

fs.writeFileSync(outputFile, htmlContent, "utf-8");
console.log("index.html generated successfully!");