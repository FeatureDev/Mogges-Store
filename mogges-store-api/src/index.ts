import { Hono } from 'hono';

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// API root (hälsokontroll)
app.get('/api', (c) => {
	return c.text('Mogges Store API is running');
});

// Products
app.get('/api/products', async (c) => {
	try {
		const { results } = await c.env.DB
			.prepare('SELECT Id, Name, Description, Price, Category, Stock, Image FROM Products')
			.all();

		return c.json(results);
	} catch (err) {
		console.error('DATABASE ERROR:', err);
		return c.json({ error: 'Database failure' }, 500);
	}
});

export default app;
