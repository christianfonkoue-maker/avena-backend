/**
 * AVENA — Hybrid Smart Image Seeder
 * Utilise ta configuration DB existante
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Utilise TA config existante
const pool = require('../config/db');

// Ta clé Unsplash
const UNSPLASH_KEY = 'u7wcrhR8VeKdhjojuTGCH85OzoxFvTiqOo0OH0HpYf8';
const IMAGES_PER_PRODUCT = 4;

// Banque d'images locale (fallback)
const LOCAL_IMAGES = {
  electronics: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
  ],
  school: [
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800',
    'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
    'https://images.unsplash.com/photo-1449157291145-7efd05087c3f?w=800',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    'https://images.unsplash.com/photo-1505693314120-0d443867893b?w=800',
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800',
  ],
  food: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
    'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800',
  ],
  dress: [
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    'https://images.unsplash.com/photo-1525373698358-041e3a460346?w=800',
  ],
  sport: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    'https://images.unsplash.com/photo-1515523110800-9415d13b84a7?w=800',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    'https://images.unsplash.com/photo-1571781418606-89165e772c1c?w=800',
    'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800',
    'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=800',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    'https://images.unsplash.com/photo-1522337094846-8f1621936d77?w=800',
  ],
};

const CACHE_FILE = path.join(__dirname, 'image-cache.json');
let imageCache = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      imageCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`📦 Cache chargé: ${Object.keys(imageCache).length} entrées`);
    }
  } catch(e) {}
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(imageCache, null, 2));
}

async function fetchUnsplashImages(query, count = 8) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=squarish`;
  
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` }
    });
    
    if (res.status === 429) {
      console.log('  ⏳ Rate limit atteint, passage en mode local...');
      return null;
    }
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.results || [];
  } catch(e) {
    console.log(`  ⚠️ Erreur réseau: ${e.message}`);
    return null;
  }
}

function getLocalImages(productTitle, category, productId, usedUrls) {
  const baseImages = LOCAL_IMAGES[category] || LOCAL_IMAGES.electronics;
  const seed = parseInt(productId.substring(0, 8), 16) || Math.floor(Math.random() * 1000);
  
  const shuffled = [...baseImages];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, IMAGES_PER_PRODUCT).filter(url => !usedUrls.has(url));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🚀 AVENA Hybrid Image Seeder');
  console.log('='.repeat(50));
  
  loadCache();
  
  try {
    // Test connexion
    await pool.query('SELECT NOW()');
    console.log('✅ Connecté à PostgreSQL\n');
    
    const { rows: products } = await pool.query(`
      SELECT id, title, category FROM products WHERE status = 'active'
    `);
    
    console.log(`📦 ${products.length} produits à traiter\n`);
    
    const usedUrls = new Set();
    let unsplashCount = 0;
    let localCount = 0;
    let totalImages = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i+1}/${products.length}] ${product.title.substring(0, 50)}`);
      
      let images = [];
      let fromUnsplash = false;
      
      // 1. Essayer le cache
      if (imageCache[product.title]) {
        console.log(`  📦 Utilisation du cache...`);
        images = imageCache[product.title].filter(url => !usedUrls.has(url));
        if (images.length >= IMAGES_PER_PRODUCT) {
          fromUnsplash = true;
          unsplashCount++;
        }
      }
      
      // 2. Essayer Unsplash si pas en cache
      if (images.length < IMAGES_PER_PRODUCT && UNSPLASH_KEY) {
        console.log(`  🔍 Recherche Unsplash...`);
        try {
          const results = await fetchUnsplashImages(product.title, 10);
          if (results && results.length > 0) {
            images = results
              .map(img => img.urls.regular)
              .filter(url => !usedUrls.has(url))
              .slice(0, IMAGES_PER_PRODUCT);
            
            if (images.length >= 2) {
              fromUnsplash = true;
              unsplashCount++;
              imageCache[product.title] = images;
              saveCache();
              console.log(`  ✅ ${images.length} images Unsplash trouvées`);
            }
          }
        } catch(e) {
          console.log(`  ⚠️ Erreur Unsplash`);
        }
      }
      
      // 3. Fallback local si besoin
      if (images.length < IMAGES_PER_PRODUCT) {
        console.log(`  📁 Fallback local...`);
        const localImages = getLocalImages(product.title, product.category, product.id, usedUrls);
        images = [...images, ...localImages].slice(0, IMAGES_PER_PRODUCT);
        localCount++;
      }
      
      if (images.length === 0) {
        console.log(`  ❌ Aucune image trouvée`);
        continue;
      }
      
      // Supprimer anciennes images
      await pool.query(`DELETE FROM product_images WHERE product_id = $1`, [product.id]);
      
      // Insérer nouvelles images
      for (let j = 0; j < images.length; j++) {
        await pool.query(
          `INSERT INTO product_images (id, product_id, url, sort_order)
           VALUES (gen_random_uuid(), $1, $2, $3)`,
          [product.id, images[j], j]
        );
        usedUrls.add(images[j]);
        totalImages++;
      }
      
      // Mettre à jour cover_image
      await pool.query(`UPDATE products SET cover_image = $1 WHERE id = $2`, [images[0], product.id]);
      
      console.log(`  ✅ ${images.length} images assignées (${fromUnsplash ? 'Unsplash' : 'Local'})`);
      
      // Pause pour rate limit (2s entre chaque)
      if (i < products.length - 1) await sleep(2000);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(50));
    console.log(`  🖼️  Images Unsplash : ${unsplashCount} produits`);
    console.log(`  📁 Fallback local  : ${localCount} produits`);
    console.log(`  📊 Total images    : ${totalImages}`);
    console.log('='.repeat(50));
    
  } catch(err) {
    console.error('❌ Erreur:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

main();
