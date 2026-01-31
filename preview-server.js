// Simple static file server for previewing
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8080;

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, 'docs')));

app.listen(PORT, () => {
    console.log(`?? Preview server running at http://localhost:${PORT}`);
    console.log(`?? Login page: http://localhost:${PORT}/login.html`);
    console.log(`????? Admin page: http://localhost:${PORT}/admin.html`);
    console.log(`?? Home page: http://localhost:${PORT}/index.html`);
});
