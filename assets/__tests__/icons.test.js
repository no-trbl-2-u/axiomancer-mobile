const fs = require('fs');
const path = require('path');

describe('App Icon Assets', () => {
  const assetsPath = path.join(__dirname, '../images');
  
  const requiredIcons = [
    { file: 'icon.png', description: 'iOS app icon', expectedSize: 1024 },
    { file: 'android-icon-foreground.png', description: 'Android adaptive foreground', expectedSize: 1024 },
    { file: 'android-icon-background.png', description: 'Android adaptive background', expectedSize: 1024 },
    { file: 'android-icon-monochrome.png', description: 'Android monochrome', expectedSize: 1024 },
    { file: 'favicon.png', description: 'Web favicon', expectedSize: 192 },
    { file: 'splash-icon.png', description: 'Splash screen icon', expectedSize: 200 }
  ];

  test.each(requiredIcons)(
    '$description ($file) exists',
    ({ file }) => {
      const iconPath = path.join(assetsPath, file);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  );

  test.each(requiredIcons)(
    '$description ($file) has valid PNG extension and size',
    ({ file }) => {
      const iconPath = path.join(assetsPath, file);
      const stats = fs.statSync(iconPath);
      
      // File should exist and have reasonable size
      expect(stats.size).toBeGreaterThan(100);
      
      // File should have PNG extension
      expect(path.extname(file)).toBe('.png');
    }
  );

  test('All required icon assets have correct file sizes', () => {
    requiredIcons.forEach(({ file }) => {
      const iconPath = path.join(assetsPath, file);
      const stats = fs.statSync(iconPath);
      // Icons should not be empty and should be reasonable file sizes
      expect(stats.size).toBeGreaterThan(100);
      expect(stats.size).toBeLessThan(50000); // 50KB reasonable upper limit for these icons
    });
  });
});