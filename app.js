import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const publicDir = path.join(__dirname, 'public');

// Convert file path ke route yang lebih robust
function toRoute(filePath) {
    let relativePath = path.relative(publicDir, filePath);
    relativePath = relativePath.split(path.sep).join('/');
    let route = relativePath.replace(/\.html$/i, '');

    if (route.toLowerCase() === 'home') return '/'; 
    
    if (route.toLowerCase().endsWith('/index')) {
        const parts = route.split('/');
        parts.pop(); 
        return '/' + parts.join('/');
    }

    return '/' + route.toLowerCase().replace(/ /g, '-');
}

// Scan folder recursively
function scanFolder(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file === 'errors') continue; 
            scanFolder(fullPath);
        } else if (file.endsWith('.html')) {
            if (dir.includes('errors')) continue;

            const routePath = toRoute(fullPath);

            router.get(routePath, (req, res) => {
                // FIX: Gunakan option root dan path relative agar konsisten
                const relativePath = path.relative(publicDir, fullPath);
                
                res.sendFile(relativePath, { root: publicDir }, (err) => {
                    if (err) {
                        console.error(`Failed to send file ${routePath}:`, err.message);
                        if (!res.headersSent) {
                            res.status(err.status || 500).send('Content unavailable');
                        }
                    }
                });
            });
            
            console.log(`Route loaded: ${routePath}`);
        }
    }
}

scanFolder(publicDir);

// -----------------------------------------------------------
// FIX: Favicon Handler dengan Callback & Root Option
// -----------------------------------------------------------
router.get('/favicon.ico', (req, res) => {
    const relativePath = '../assets/images/favicon.ico'; // Relative dari publicDir (karena kita set root nanti)
    const absPath = path.join(__dirname, 'assets/images/favicon.ico');
    
    if (fs.existsSync(absPath)) {
        // Kita gunakan root: __dirname untuk path yang keluar dari public
        res.sendFile('assets/images/favicon.ico', { root: __dirname }, (err) => {
            if (err) res.status(204).end(); // Silent fail
        });
    } else {
        res.status(204).end();
    }
});

// -----------------------------------------------------------
// FIX: Robots.txt Handler dengan Callback (Penyebab Error Sebelumnya)
// -----------------------------------------------------------
router.get('/robots.txt', (req, res) => {
    const relativePath = 'robots.txt';
    const absPath = path.join(publicDir, relativePath);

    if (fs.existsSync(absPath)) {
        res.sendFile(relativePath, { root: publicDir }, (err) => {
            if (err) {
                console.error('[WARN] Failed to send robots.txt:', err.message);
                res.status(404).end();
            }
        });
    } else {
        res.type('text/plain');
        res.send('User-agent: *\nDisallow:');
    }
});

export default router;