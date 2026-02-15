// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	DB: D1Database;
	AI: Ai;
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
// ROLE HELPERS
// ==========================================

const ROLE_LEVELS: Record<string, number> = {
	'master': 1,
	'admin': 2,
	'employee': 3,
	'user': 4
};

function hasRole(userRole: string, requiredRole: string): boolean {
	const userLevel = ROLE_LEVELS[userRole] || 99;
	const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
	return userLevel <= requiredLevel;
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
			'http://127.0.0.1:8080',
			'http://localhost:5500',
			'http://127.0.0.1:5500',

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

// ==========================================
// REGISTER (public)
// ==========================================

app.post('/api/register', async (c) => {
	const body = await c.req.json();
	const { email, password } = body;

	if (!email || !password) {
		return c.json({ error: 'Email and password required' }, 400);
	}

	try {
		// Check if email already exists
		const existing = await c.env.DB
			.prepare('SELECT Id FROM Users WHERE Email = ?')
			.bind(email)
			.first();

		if (existing) {
			return c.json({ error: 'Email already in use' }, 409);
		}

		// Hash password
		const hashedPassword = await hashPassword(password);

		// Insert new customer (default role = user)
		await c.env.DB
			.prepare('INSERT INTO Users (Email, Password, Role) VALUES (?, ?, ?)')
			.bind(email, hashedPassword, 'user')
			.run();

		return c.json({ message: 'Account created successfully' }, 201);
	} catch (err) {
		console.error('Register error:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});


app.get('/api/check-auth', async (c) => {
	const user = await getAuthUser(c);
	if (user) {
		return c.json({
			authenticated: true,
			user: { email: user.email, role: user.role },
			permissions: {
				canAccessAdmin: hasRole(user.role, 'employee'),
				canManageProducts: hasRole(user.role, 'admin'),
				canManageUsers: hasRole(user.role, 'admin'),
				canManageSystem: hasRole(user.role, 'master')
			}
		});
	}
	return c.json({ authenticated: false });
});

app.post('/api/logout', (c) => {
	return c.json({ message: 'Logout successful' });
});

// ==========================================
// USERS ROUTES (admin+)
// ==========================================

app.get('/api/users', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'admin')) {
		return c.json({ error: 'Forbidden' }, 403);
	}

	try {
		const { results } = await c.env.DB
			.prepare('SELECT Id as id, Email as email, Role as role FROM Users')
			.all();
		return c.json(results);
	} catch (err) {
		console.error('Error fetching users:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.put('/api/admin/update-role', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'master')) {
		return c.json({ error: 'Forbidden - Master admin required' }, 403);
	}

	const { userId, newRole } = await c.req.json();

	if (!userId || !newRole || !ROLE_LEVELS[newRole]) {
		return c.json({ error: 'Valid userId and role required' }, 400);
	}

	try {
		await c.env.DB
			.prepare('UPDATE Users SET Role = ? WHERE Id = ?')
			.bind(newRole, userId)
			.run();

		return c.json({ message: 'Role updated' });
	} catch (err) {
		console.error('Error updating role:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.delete('/api/admin/delete-user/:id', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'master')) {
		return c.json({ error: 'Forbidden - Master admin required' }, 403);
	}

	const id = c.req.param('id');

	if (Number(id) === user.sub) {
		return c.json({ error: 'Cannot delete yourself' }, 400);
	}

	try {
		await c.env.DB
			.prepare('DELETE FROM Users WHERE Id = ?')
			.bind(id)
			.run();

		return c.json({ message: 'User deleted' });
	} catch (err) {
		console.error('Error deleting user:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

// ==========================================
// CART ROUTES (authenticated users)
// ==========================================

app.get('/api/cart', async (c) => {
	const user = await getAuthUser(c);
	if (!user) return c.json({ error: 'Unauthorized' }, 401);

	try {
		const { results } = await c.env.DB
			.prepare(`
				SELECT c.ProductId as id, p.Name as name, p.Price as price, p.Image as image, p.Category as category, c.Quantity as quantity
				FROM Cart c
				JOIN Products p ON c.ProductId = p.Id
				WHERE c.UserId = ?
			`)
			.bind(user.sub)
			.all();
		return c.json(results);
	} catch (err) {
		console.error('Error fetching cart:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.post('/api/cart', async (c) => {
	const user = await getAuthUser(c);
	if (!user) return c.json({ error: 'Unauthorized' }, 401);

	const { productId, quantity } = await c.req.json();
	if (!productId || !quantity || quantity < 1) {
		return c.json({ error: 'productId and quantity required' }, 400);
	}

	try {
		await c.env.DB
			.prepare(`
				INSERT INTO Cart (UserId, ProductId, Quantity) VALUES (?, ?, ?)
				ON CONFLICT(UserId, ProductId) DO UPDATE SET Quantity = ?
			`)
			.bind(user.sub, productId, quantity, quantity)
			.run();
		return c.json({ message: 'Cart updated' });
	} catch (err) {
		console.error('Error updating cart:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.post('/api/cart/sync', async (c) => {
	const user = await getAuthUser(c);
	if (!user) return c.json({ error: 'Unauthorized' }, 401);

	const { items } = await c.req.json();
	if (!Array.isArray(items)) return c.json({ error: 'items array required' }, 400);

	try {
		for (const item of items) {
			if (!item.id || !item.quantity) continue;
			await c.env.DB
				.prepare(`
					INSERT INTO Cart (UserId, ProductId, Quantity) VALUES (?, ?, ?)
					ON CONFLICT(UserId, ProductId) DO UPDATE SET Quantity = Quantity + ?
				`)
				.bind(user.sub, item.id, item.quantity, item.quantity)
				.run();
		}

		const { results } = await c.env.DB
			.prepare(`
				SELECT c.ProductId as id, p.Name as name, p.Price as price, p.Image as image, p.Category as category, c.Quantity as quantity
				FROM Cart c
				JOIN Products p ON c.ProductId = p.Id
				WHERE c.UserId = ?
			`)
			.bind(user.sub)
			.all();

		return c.json(results);
	} catch (err) {
		console.error('Error syncing cart:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.delete('/api/cart/:productId', async (c) => {
	const user = await getAuthUser(c);
	if (!user) return c.json({ error: 'Unauthorized' }, 401);

	const productId = c.req.param('productId');
	try {
		await c.env.DB
			.prepare('DELETE FROM Cart WHERE UserId = ? AND ProductId = ?')
			.bind(user.sub, productId)
			.run();
		return c.json({ message: 'Item removed' });
	} catch (err) {
		console.error('Error removing cart item:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.delete('/api/cart', async (c) => {
	const user = await getAuthUser(c);
	if (!user) return c.json({ error: 'Unauthorized' }, 401);

	try {
		await c.env.DB
			.prepare('DELETE FROM Cart WHERE UserId = ?')
			.bind(user.sub)
			.run();
		return c.json({ message: 'Cart cleared' });
	} catch (err) {
		console.error('Error clearing cart:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

// ==========================================
// ORDERS ROUTES (employee+)
// ==========================================

app.get('/api/orders', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'employee')) {
		return c.json({ error: 'Forbidden' }, 403);
	}

	try {
		const { results } = await c.env.DB
			.prepare(`
				SELECT o.Id as id, u.Email as email, o.Status as status, o.CreatedAt as createdAt,
					   COUNT(oi.Id) as itemCount, SUM(oi.Quantity * oi.Price) as total
				FROM Orders o
				JOIN Users u ON o.UserId = u.Id
				JOIN OrderItems oi ON oi.OrderId = o.Id
				GROUP BY o.Id
				ORDER BY o.CreatedAt DESC
			`)
			.all();
		return c.json(results);
	} catch (err) {
		console.error('Error fetching orders:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.get('/api/orders/:id', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'employee')) {
		return c.json({ error: 'Forbidden' }, 403);
	}

	const id = c.req.param('id');
	try {
		const order = await c.env.DB
			.prepare('SELECT o.Id as id, u.Email as email, o.Status as status, o.CreatedAt as createdAt FROM Orders o JOIN Users u ON o.UserId = u.Id WHERE o.Id = ?')
			.bind(id)
			.first();

		if (!order) return c.json({ error: 'Order not found' }, 404);

		const { results: items } = await c.env.DB
			.prepare('SELECT oi.Id as id, p.Name as productName, oi.Quantity as quantity, oi.Price as price FROM OrderItems oi JOIN Products p ON oi.ProductId = p.Id WHERE oi.OrderId = ?')
			.bind(id)
			.all();

		return c.json({ ...order, items });
	} catch (err) {
		console.error('Error fetching order:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

app.put('/api/orders/:id/status', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'admin')) {
		return c.json({ error: 'Forbidden - Admin access required' }, 403);
	}

	const id = c.req.param('id');
	const { status } = await c.req.json();

	if (!['pending', 'paid', 'shipped', 'cancelled'].includes(status)) {
		return c.json({ error: 'Invalid status' }, 400);
	}

	try {
		await c.env.DB
			.prepare('UPDATE Orders SET Status = ? WHERE Id = ?')
			.bind(status, id)
			.run();
		return c.json({ message: 'Order status updated' });
	} catch (err) {
		console.error('Error updating order:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});

// ==========================================
// ADMIN ROUTES (protected)
// ==========================================

app.post('/api/products', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'admin')) {
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
	if (!user || !hasRole(user.role, 'admin')) {
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
	if (!user || !hasRole(user.role, 'admin')) {
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

// Admin: Create user with any role
app.post('/api/admin/create-user', async (c) => {
	const user = await getAuthUser(c);
	if (!user || !hasRole(user.role, 'admin')) {
		return c.json({ error: 'Forbidden - Admin access required' }, 403);
	}

	const { email, password, role } = await c.req.json();

	if (!email || !password || !role) {
		return c.json({ error: 'Email, password and role required' }, 400);
	}

	if (!ROLE_LEVELS[role]) {
		return c.json({ error: 'Invalid role. Valid roles: master, admin, employee, user' }, 400);
	}

	if (role === 'master' && user.role !== 'master') {
		return c.json({ error: 'Only master admins can create master accounts' }, 403);
	}

	if (role === 'admin' && !hasRole(user.role, 'master')) {
		return c.json({ error: 'Only master admins can create admin accounts' }, 403);
	}

	try {
		const existingUser = await c.env.DB
			.prepare('SELECT Id FROM Users WHERE Email = ?')
			.bind(email)
			.first();

		if (existingUser) {
			return c.json({ error: 'Email already exists' }, 409);
		}

		const hashedPassword = await hashPassword(password);

		await c.env.DB
			.prepare('INSERT INTO Users (Email, Password, Role) VALUES (?, ?, ?)')
			.bind(email, hashedPassword, role)
			.run();

		return c.json({ message: 'User created successfully' }, 201);
	} catch (err) {
		console.error('Admin create user error:', err);
		return c.json({ error: 'Server error' }, 500);
	}
});


// ==========================================
// CHATBOT - "Mogge" (Workers AI)
// ==========================================

const MOGGE_SYSTEM_PROMPT = `Du ar Mogge, den varma och personliga shoppingassistenten pa Mogges Store — en modern klädbutik online.

Personlighet:
- Du ar glad, omtanksam och lite charmig med humor
- Du anvander hjart-emojis 💜 ibland men inte for mycket
- Du ar som en vanlig kompis som jobbar i en klädbutik
- Du svarar ALLTID pa svenska
- Du haller svaren korta och trevliga (max 2-3 meningar)
- Om nagon verkar ledsen eller stressad, var extra snall

Butiksinformation:
- Butiken heter Mogges Store (mogges-store.se)
- Vi saljer klader: Dam Mode, Herr Mode, Accessoarer, Skor
- Fri frakt over 499 kr
- 30 dagars öppet kop
- Kontakt: info@moggesstore.se, tel: +46 123 456 789

Regler:
- Svara BARA om shopping, klader, butiken eller kundservice
- Om nagon fragar om politik, religion eller olämpliga amnen: avled artigt tillbaka till shopping
- Anvand ALDRIG engelska om inte kunden skriver pa engelska
- Om du far produktdata, rekommendera baserat pa den`;

app.post('/api/chat', async (c) => {
	const { message, history } = await c.req.json();

	if (!message || typeof message !== 'string') {
		return c.json({ error: 'Message required' }, 400);
	}

	try {
		// Fetch products for context
		const { results: products } = await c.env.DB
			.prepare('SELECT Name, Price, Category, Stock FROM Products WHERE Stock > 0 LIMIT 20')
			.all();

		const productContext = products.length > 0
			? '\n\nProdukter i lager just nu:\n' + products.map((p: any) =>
				`- ${p.Name} (${p.Category}) - ${p.Price} kr, ${p.Stock} i lager`
			).join('\n')
			: '';

		// Check if user is logged in and get their order info
		let orderContext = '';
		const user = await getAuthUser(c);
		if (user) {
			const { results: orders } = await c.env.DB
				.prepare(`
					SELECT o.Id, o.Status, o.CreatedAt, SUM(oi.Quantity * oi.Price) as total
					FROM Orders o
					JOIN OrderItems oi ON oi.OrderId = o.Id
					WHERE o.UserId = ?
					GROUP BY o.Id
					ORDER BY o.CreatedAt DESC
					LIMIT 3
				`)
				.bind(user.sub)
				.all();

			if (orders.length > 0) {
				orderContext = '\n\nKundens ordrar:\n' + orders.map((o: any) =>
					`- Order #${o.Id}: ${o.Status}, ${Math.round(o.total)} kr (${o.CreatedAt})`
				).join('\n');
			}
		}

		const messages: Array<{ role: string; content: string }> = [
			{ role: 'system', content: MOGGE_SYSTEM_PROMPT + productContext + orderContext }
		];

		// Add conversation history (last 6 messages)
		if (Array.isArray(history)) {
			const recentHistory = history.slice(-6);
			for (const h of recentHistory) {
				if (h.role === 'user' || h.role === 'assistant') {
					messages.push({ role: h.role, content: h.content });
				}
			}
		}

		messages.push({ role: 'user', content: message });

		// Detect category/product navigation intent
		const msgLower = message.toLowerCase();
		const categoryMap: Record<string, string> = {
			'skor': 'Skor',
			'sko': 'Skor',
			'sneakers': 'Skor',
			'dam': 'Dam Mode',
			'damklader': 'Dam Mode',
			'dammode': 'Dam Mode',
			'klanning': 'Dam Mode',
			'herr': 'Herr Mode',
			'herrklader': 'Herr Mode',
			'herrmode': 'Herr Mode',
			'accessoarer': 'Accessoarer',
			'accessoar': 'Accessoarer',
			'vaska': 'Accessoarer',
			'smycke': 'Accessoarer'
		};

		let action: any = null;

		// Check if message mentions a category — navigate directly
		for (const [keyword, category] of Object.entries(categoryMap)) {
			if (msgLower.includes(keyword)) {
				action = { type: 'navigate', url: '/products.html?category=' + encodeURIComponent(category), label: 'Visa ' + category };
				break;
			}
		}

		// If no category match but has show intent, try free-text search
		if (!action) {
			const showKeywords = ['visa', 'visar', 'se', 'titta', 'kolla', 'har ni', 'finns det', 'sok', 'hitta', 'vill ha', 'letar efter', 'shoppa'];
			const isShowIntent = showKeywords.some(k => msgLower.includes(k));
			if (isShowIntent) {
				const searchWords = msgLower.replace(/visa|visar|se|titta|kolla|har ni|finns det|sok|hitta|vill ha|letar efter|shoppa|mig|era|nagra|nagon|kan du|kan jag|pa|i|for|med|ett|en|det|den|de|som/g, '').trim();
				if (searchWords.length > 2) {
					action = { type: 'navigate', url: '/products.html?search=' + encodeURIComponent(searchWords), label: 'Sok: ' + searchWords };
				}
			}
		}

		const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
			messages: messages,
			max_tokens: 256,
			temperature: 0.7
		});

		const result: any = {
			reply: (response as any).response || 'Oj, jag tappade traden! Kan du fraga igen? 💜'
		};

		if (action) {
			result.action = action;
		}

		return c.json(result);
	} catch (err) {
		console.error('Chat error:', err);
		return c.json({
			reply: 'Oj, nagonting gick fel hos mig! Prova igen om en stund 💜'
		});
	}
});


export default app;
