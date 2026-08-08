export const DEFAULT_STARTER_FILES = [
  {
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeCanvas Live App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1 id="title">✨ Welcome to CodeCanvas Live</h1>
    <p>Edit HTML, CSS, and JS to see real-time updates instantly!</p>
    <button id="btn" class="primary-btn">Click Me!</button>
    <p id="counter" class="counter">Button clicks: 0</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`
  },
  {
    name: 'style.css',
    language: 'css',
    content: `/* Clean top-left unstyled default layout */
.container {
  max-width: 600px;
}

h1 {
  font-size: 24px;
  color: #06b6d4;
  margin-top: 0;
}

.primary-btn {
  background: #06b6d4;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
}

.primary-btn:hover {
  background: #38bdf8;
}

.counter {
  margin-top: 12px;
  font-size: 14px;
  color: #64748b;
}`
  },
  {
    name: 'script.js',
    language: 'javascript',
    content: `// Interactive JavaScript logic
let count = 0;
const button = document.getElementById('btn');
const counterDisplay = document.getElementById('counter');

if (button && counterDisplay) {
  button.addEventListener('click', () => {
    count++;
    counterDisplay.textContent = \`Button clicks: \${count}\`;
    console.log(\`[CodeCanvas] Interactive click count: \${count}\`);
  });
}

console.log('✨ CodeCanvas Live Preview initialized cleanly!');`
  }
];
