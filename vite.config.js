const { defineConfig } = require('vite');
const path = require('path');
const fs = require('fs');
const react = require('@vitejs/plugin-react');

// Function to copy static assets to the dist folder
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle: async () => {
      // Copy sounds directory
      const soundsSrc = path.resolve(__dirname, 'sounds');
      const soundsDest = path.resolve(__dirname, 'dist/sounds');
      
      if (fs.existsSync(soundsSrc)) {
        if (!fs.existsSync(soundsDest)) {
          fs.mkdirSync(soundsDest, { recursive: true });
        }
        
        const soundFiles = fs.readdirSync(soundsSrc);
        soundFiles.forEach(file => {
          const srcPath = path.join(soundsSrc, file);
          const destPath = path.join(soundsDest, file);
          fs.copyFileSync(srcPath, destPath);
        });
        console.log('Copied sounds directory to dist folder');
      }

      // Copy fonts directory
      const fontsSrc = path.resolve(__dirname, 'fonts');
      const fontsDest = path.resolve(__dirname, 'dist/fonts');
      
      if (fs.existsSync(fontsSrc)) {
        if (!fs.existsSync(fontsDest)) {
          fs.mkdirSync(fontsDest, { recursive: true });
        }
        
        const fontFiles = fs.readdirSync(fontsSrc);
        fontFiles.forEach(file => {
          const srcPath = path.join(fontsSrc, file);
          const destPath = path.join(fontsDest, file);
          fs.copyFileSync(srcPath, destPath);
        });
        console.log('Copied fonts directory to dist folder');
      }
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
    react(),
    copyStaticAssets()
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        game: path.resolve(__dirname, 'game.html'),
        reactAuth: path.resolve(__dirname, 'react-auth.html')
      },
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
