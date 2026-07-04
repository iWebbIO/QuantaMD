const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

async function run() {
  const ctx = await esbuild.context({
    entryPoints: [
      path.join(__dirname, '../electron/main.ts'),
      path.join(__dirname, '../electron/preload.ts')
    ],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: path.join(__dirname, '../dist-electron'),
    external: ['electron'],
    sourcemap: true,
    minify: false,
  });

  if (isWatch) {
    console.log('Watching Electron files...');
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Electron files compiled successfully.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
