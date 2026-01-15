import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 3001;
const DIST = join(__dirname, 'dist');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let filePath = join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);

        // Prevent directory traversal
        if (!filePath.startsWith(DIST)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        try {
            // Try to serve the static file
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) {
                // If directory, try index.html (though usually only root / hits this)
                filePath = join(filePath, 'index.html');
            }

            const content = await readFile(filePath);
            const ext = extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            res.end(content);

        } catch (err) {
            if (err.code === 'ENOENT') {
                // SPA Fallback: If file not found and it's a navigation request (no extension), serve index.html
                if (!extname(url.pathname)) {
                    try {
                        const indexHtml = await readFile(join(DIST, 'index.html'));
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexHtml);
                    } catch (e) {
                        res.writeHead(404);
                        res.end('404: Build not found. Run npm run build.');
                    }
                } else {
                    // It's a missing asset (like .js or .css)
                    res.writeHead(404);
                    res.end('404 Not Found');
                }
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end('Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur: http://localhost:${PORT}`);
});
