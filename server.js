import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import router from './app.js';
import fetch from 'node-fetch';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
const settingsPath = path.join(__dirname, 'settings.json'); // Path ke settings.json

// Middleware: IP logging + geolocation
app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (req.url.startsWith('/assets') || req.url.includes('favicon')) return next();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); 
        
        const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[${new Date().toISOString()}] Visitor: ${ip} | ${data.city || 'N/A'}, ${data.country_name || 'N/A'} -> ${req.url}`);
        } else {
            console.log(`[${new Date().toISOString()}] Visitor: ${ip} -> ${req.url}`);
        }
    } catch (err) {
        console.log(`[${new Date().toISOString()}] Visitor: ${ip} -> ${req.url} (Geo failed)`);
    }
    next();
});

// -----------------------------------------------------------
// FITUR BARU: MAINTENANCE MODE MIDDLEWARE
// -----------------------------------------------------------
app.use((req, res, next) => {
    // 1. Bypass untuk assets/favicon supaya halaman 503 tidak rusak tampilannya
    if (req.url.startsWith('/assets') || req.url.includes('favicon') || req.url.startsWith('/errors')) {
        return next();
    }

    // 2. Baca settings.json setiap request (agar realtime tanpa restart jika diedit)
    // Jika ingin performa tinggi, baca di luar middleware (tapi harus restart server kalau edit)
    try {
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);

            if (settings.maintenanceMode === true) {
                // Kirim 503
                const relativeErrorPath = 'errors/503.html';
                const absErrorPath = path.join(publicDir, relativeErrorPath);

                // Jika file 503 ada, kirim file
                if (fs.existsSync(absErrorPath)) {
                    return res.status(503).sendFile(relativeErrorPath, { root: publicDir }, (err) => {
                        if (err) console.error('Gagal kirim 503:', err.message);
                    });
                } 
                // Jika file 503 tidak ada, kirim text
                else {
                    return res.status(503).send('<h1>503 Service Unavailable</h1><p>We are currently under maintenance.</p>');
                }
            }
        }
    } catch (err) {
        console.error('Gagal membaca settings.json:', err.message);
        // Lanjut saja jika error baca config, jangan matikan server
    }

    next();
});

// Static assets
app.use(express.static(publicDir));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Auto routes dari app.js
app.use(router);

// -----------------------------------------------------------
// 404 Handler
// -----------------------------------------------------------
app.use((req, res) => {
    const relativeErrorPath = 'errors/404.html';
    const absErrorPath = path.join(publicDir, relativeErrorPath);

    const sendFallback = () => {
        if (!res.headersSent) {
            res.status(404).send('<h1>404 Not Found</h1><p>The requested resource could not be found (Fallback Mode).</p>');
        }
    };

    if (fs.existsSync(absErrorPath)) {
        res.status(404).sendFile(relativeErrorPath, { root: publicDir }, (err) => {
            if (err) {
                console.error('------------------------------------------------');
                console.error(`[ERROR] Gagal mengirim file 404: ${absErrorPath}`);
                console.error(`Penyebab: ${err.message}`);
                console.error('------------------------------------------------');
                sendFallback();
            }
        });
    } else {
        console.warn(`[WARN] File custom error tidak ditemukan di: ${absErrorPath}`);
        sendFallback();
    }
});

// -----------------------------------------------------------
// Global Error Handler
// -----------------------------------------------------------
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    const status = err.status || 500;
    
    const relativeErrorPath = `errors/${status}.html`;
    const absErrorPath = path.join(publicDir, relativeErrorPath);

    const sendFallback = () => {
        if (!res.headersSent) {
            res.status(status).send(`<h1>Error ${status}</h1><p>${err.message || 'Internal Server Error'}</p>`);
        }
    };

    if (fs.existsSync(absErrorPath)) {
        res.status(status).sendFile(relativeErrorPath, { root: publicDir }, (fileErr) => {
            if (fileErr) {
                console.error(`[ERROR] Gagal mengirim file error ${status}:`, fileErr.message);
                sendFallback();
            }
        });
    } else {
        sendFallback();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});