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
    } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".pdf"))) {
      return {
        name: entry.name,
        type: entry.name.endsWith(".md") ? "markdown" : "pdf",
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
        } else if (item.type === "markdown") {
          return `<li><a href="?file=${item.path}">${item.name}</a></li>`;
        } else if (item.type === "pdf") {
          return `<li><a href="?pdf=${item.path}">${item.name}</a></li>`;
        }
        return "";
      })
      .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <title>Documentation</title>
</head>
<body>
  <div class="container">
    <h1>Documentation</h1>
    <ul>
      ${generateList(tree)}
    </ul>
    <div id="markdown-container">
      <p>Select a file to view its content here.</p>
    </div>
  </div>
  <script>
    async function renderMarkdown(file) {
      const response = await fetch(file);
      const markdown = await response.text();
      const container = document.getElementById("markdown-container");
      container.innerHTML = marked.parse(markdown);
    }

    function renderPDF(file) {
      const container = document.getElementById("markdown-container");
      container.innerHTML = \`
        <iframe src="\${file}" style="width: 100%; height: 600px;" frameborder="0"></iframe>
      \`;
    }

    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");
    const pdf = params.get("pdf");

    if (file) {
      renderMarkdown(file);
    } else if (pdf) {
      renderPDF(pdf);
    }

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
