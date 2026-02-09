// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	DB: D1Database;
};

type JwtPayload = {
	sub: number;
	email: string;
	role: string;
	exp: number;
};

const app = new Hono<{ Bindings: Bindings }>();

// ==========================================
// JWT HELPERS (Web Crypto API)
// ==========================================

const JWT_SECRET = 'mogges-store-secret-key-2026';

function base64url(data: string): string {
	return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	return atob(str);
}

async function createJwt(payload: JwtPayload): Promise<string> {
	const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = base64url(JSON.stringify(payload));
	const data = `${header}.${body}`;

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(JWT_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
		.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

	return `${data}.${sig}`;
}

async function verifyJwt(token: string): Promise<JwtPayload | null> {
	try {
		const [header, body, sig] = token.split('.');
		if (!header || !body || !sig) return null;

		const data = `${header}.${body}`;
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(JWT_SECRET),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);

		const sigStr = base64urlDecode(sig);
		const sigBytes = new Uint8Array([...sigStr].map(c => c.charCodeAt(0)));
		const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));

		if (!valid) return null;

		const payload: JwtPayload = JSON.parse(base64urlDecode(body));
		if (payload.exp && Date.now() / 1000 > payload.exp) return null;

		return payload;
	} catch {
		return null;
	}
}

// ==========================================
// PASSWORD HASHING (SHA-256, Workers-compatible)
// ==========================================

async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const inputHash = await hashPassword(password);
	return inputHash === storedHash;
}

// ==========================================
// AUTH HELPER
// ==========================================

async function getAuthUser(c: any): Promise<JwtPayload | null> {
	const authHeader = c.req.header('Authorization');
	if (!authHeader?.startsWith('Bearer ')) return null;
	return await verifyJwt(authHeader.slice(7));
}

/**
 * CORS middleware
 * Allows frontend on mogges-store.se to access API
 */
app.use(
	'/api/*',
	cors({
		origin: [
			'https://www.mogges-store.se',
			'https://mogges-store.se',
			'http://localhost:8080',
			'http://127.0.0.1:8080'
		],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
		credentials: true
	})
);

// API root
app.get('/api', (c) => {
	return c.text('Mogges Store API is running');
});

// ==========================================
// PRODUCTS (public)
// ==========================================

app.get('/api/products', async (c) => {
	const { results } = await c.env.DB
		.prepare(
			'SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products'
		)
		.all();

	return c.json(results);
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/login', async (c) => {
	const body = await c.req.json();
	const { email, password } = body;

	if (!email || !password) {
		return c.json({ error: 'Email and password required' }, 400);
	}

	try {
		const user = await c.env.DB
			.prepare('SELECT Id, Email, Password, Role FROM Users WHERE Email = ?')
			.bind(email)
			.first();

		if (!user) {
			return c.json({ error: 'Invalid credentials' }, 401);
		}

		const match = await verifyPassword(password, user.Password as string);
		if (!match) {
			return c.json({ error: 'Invalid credentials' }, 401);
		}

		const token = await createJwt({
			sub: user.Id as number,
			email: user.Email as string,
			role: user.Role as string,
			exp: Math.floor(Date.now() / 1000) + 86400
		});

		return c.json({
			message: 'Login successful',
			token,
			user: {
				email: user.Email,
				role: user.Role
			}
		});
	} catch (err) {
		console.error('Login error:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.get('/api/check-auth', async (c) => {
	const user = await getAuthUser(c);
	if (user) {
		return c.json({
			authenticated: true,
			user: { email: user.email, role: user.role }
		});
	}
	return c.json({ authenticated: false });
});

app.post('/api/logout', (c) => {
	return c.json({ message: 'Logout successful' });
});

// ==========================================
// ADMIN ROUTES (protected)
// ==========================================

app.post('/api/products', async (c) => {
	const user = await getAuthUser(c);
	if (!user || user.role !== 'admin') {
		return c.json({ error: 'Forbidden - Admin access required' }, 403);
	}

	const { name, description, price, category, stock, image } = await c.req.json();
	if (!name || !price) {
		return c.json({ error: 'Name and price are required' }, 400);
	}

	try {
		const result = await c.env.DB
			.prepare('INSERT INTO Products (Name, Description, Price, Category, Stock, Image) VALUES (?, ?, ?, ?, ?, ?)')
			.bind(name, description, price, category, stock || 0, image || 'picture/1.jpg')
			.run();

		return c.json({ message: 'Product created', id: result.meta.last_row_id });
	} catch (err) {
		console.error('Error creating product:', err);
		return c.json({ error: 'Failed to create product' }, 500);
	}
});

app.put('/api/products/:id', async (c) => {
	const user = await getAuthUser(c);
	if (!user || user.role !== 'admin') {
		return c.json({ error: 'Forbidden - Admin access required' }, 403);
	}

	const id = c.req.param('id');
	const { name, description, price, category, stock, image } = await c.req.json();

	try {
		await c.env.DB
			.prepare('UPDATE Products SET Name=?, Description=?, Price=?, Category=?, Stock=?, Image=? WHERE Id=?')
			.bind(name, description, price, category, stock, image, id)
			.run();

		return c.json({ message: 'Product updated' });
	} catch (err) {
		console.error('Error updating product:', err);
		return c.json({ error: 'Failed to update product' }, 500);
	}
});

app.delete('/api/products/:id', async (c) => {
	const user = await getAuthUser(c);
	if (!user || user.role !== 'admin') {
		return c.json({ error: 'Forbidden - Admin access required' }, 403);
	}

	const id = c.req.param('id');

	try {
		await c.env.DB
			.prepare('DELETE FROM Products WHERE Id=?')
			.bind(id)
			.run();

		return c.json({ message: 'Product deleted' });
	} catch (err) {
		console.error('Error deleting product:', err);
		return c.json({ error: 'Failed to delete product' }, 500);
	}
});

export default app;
