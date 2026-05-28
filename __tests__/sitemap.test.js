/**
 * @file Sitemap SEO functionality smoke test
 */

const fs = require('fs');
const path = require('path');

describe('Sitemap SEO', () => {
  it('sitemap.xml exists in public directory for web builds', () => {
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
  });

  it('sitemap.xml contains valid XML structure with main routes', () => {
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    const content = fs.readFileSync(sitemapPath, 'utf8');
    
    // Check XML structure
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    
    // Check main routes are present
    expect(content).toContain('<loc>https://axiomancer-mobile.app/</loc>');
    expect(content).toContain('<loc>https://axiomancer-mobile.app/combat</loc>');
    expect(content).toContain('<loc>https://axiomancer-mobile.app/character</loc>');
    expect(content).toContain('<loc>https://axiomancer-mobile.app/exploration</loc>');
    expect(content).toContain('<loc>https://axiomancer-mobile.app/inventory</loc>');
    expect(content).toContain('<loc>https://axiomancer-mobile.app/memoir</loc>');
    expect(content).toContain('<loc>https://axiomancer-mobile.app/event</loc>');
  });

  it('sitemap.xml uses proper priority hierarchy', () => {
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    const content = fs.readFileSync(sitemapPath, 'utf8');
    
    // Root should have highest priority
    const rootMatch = content.match(/<url>[\s\S]*?<loc>https:\/\/axiomancer-mobile\.app\/<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>[\s\S]*?<\/url>/);
    expect(rootMatch).toBeTruthy();
    expect(parseFloat(rootMatch[1])).toBe(1.0);
    
    // Main game screens should have high priority
    expect(content).toContain('<priority>0.8</priority>');
    
    // Event screen should have lower priority
    const eventMatch = content.match(/<url>[\s\S]*?<loc>https:\/\/axiomancer-mobile\.app\/event<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>[\s\S]*?<\/url>/);
    expect(eventMatch).toBeTruthy();
    expect(parseFloat(eventMatch[1])).toBe(0.6);
  });
});