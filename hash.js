// JavaScript source code
import bcrypt from 'bcryptjs';

const password = 'Maria0909082786';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
