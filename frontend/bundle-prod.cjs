const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function buildApp() {
  console.log('1. Bundling JavaScript with esbuild...');
  if (!fs.existsSync('dist/assets')) {
    fs.mkdirSync('dist/assets', { recursive: true });
  }

  // 1. Bundle JS
  await esbuild.build({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'esm',
    target: ['es2020'],
    outfile: 'dist/assets/index-app.js',
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env.VITE_API_BASE_URL': '""',
      'import.meta.env.VITE_RAZORPAY_KEY_ID': '"rzp_test_homeserve_key"',
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.MODE': '"production"'
    }
  });
  console.log('JS Bundle created: dist/assets/index-app.js');

  // 2. Build Tailwind CSS
  console.log('2. Compiling Tailwind CSS...');
  const { execSync } = require('child_process');
  execSync('npx tailwindcss -i ./src/styles/index.css -o ./dist/assets/index-style.css --minify', { stdio: 'inherit' });
  console.log('CSS Bundle created: dist/assets/index-style.css');

  // 3. Copy public directory assets
  if (fs.existsSync('public')) {
    fs.cpSync('public', 'dist', { recursive: true });
  }

  // 4. Generate index.html pointing to our bundled JS and CSS
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HomeServe Atelier — Architectural Home Concierge & Booking SaaS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" crossorigin href="/assets/index-style.css">
    <link rel="stylesheet" crossorigin href="/assets/index-app.css">
  </head>
  <body class="bg-[#f8faf9] text-slate-900 antialiased selection:bg-brand-600 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/assets/index-app.js"></script>
  </body>
</html>`;
  fs.writeFileSync(path.resolve('dist/index.html'), htmlTemplate, 'utf8');
  console.log('dist/index.html generated.');
  console.log('Build completed successfully!');
}

buildApp().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
