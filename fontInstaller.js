// Function to check if font is installed
function isFontInstalled(fontName) {
  const font = new FontFaceObserver(fontName);
  return font.check();
}

// Function to install the font
async function installFont() {
  try {
    // Check if font is already installed
    const isInstalled = await isFontInstalled('ACfont');
    if (isInstalled) {
      console.log('Font is already installed');
      return;
    }

    // Create a font face
    const fontFace = new FontFace('ACfont', 'url(fonts/ACfont.otf)');
    try {
      await fontFace.load();
      document.fonts.add(fontFace);
    } catch (error) {
      console.error('Error installing font:', error);
    }
  } catch (error) {
    console.error('Error installing font:', error);
  }
}

// Install the font when the page loads
document.addEventListener('DOMContentLoaded', installFont);
