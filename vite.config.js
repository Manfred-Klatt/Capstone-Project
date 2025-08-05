const { defineConfig } = require('vite');
const path = require('path');
const fs = require('fs');

// Function to copy the sounds directory to the dist folder
function copySoundsFolder() {
  return {
    name: 'copy-sounds-folder',
    closeBundle: async () => {
      const srcDir = path.resolve(__dirname, 'sounds');
      const destDir = path.resolve(__dirname, 'dist/sounds');
      
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy all files from source to destination
      const files = fs.readdirSync(srcDir);
      files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        fs.copyFileSync(srcPath, destPath);
      });
      
      console.log('Copied sounds directory to dist folder');
    }
  };
}

module.exports = defineConfig({
  root: path.resolve(__dirname, './'),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    port: 3000,
    open: true,
    cors: true
  },
  plugins: [
    copySoundsFolder()
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // All assets go to the assets directory
          return 'assets/[name].[hash][extname]';
        }
      }
    }
  }
});
