import { Response } from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { AuthRequest, User } from '../types/index.js';

const SALT_ROUNDS = 10;

export async function register(req: AuthRequest, res: Response) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
  }

  try {
    const db = await getDatabase();

    // Verificar se o email já existe
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);

    if (existingUser) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Inserir usuário no banco de dados
    const result = await db.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name]
    );

    console.log(`✅ Novo usuário registrado: ${email}`);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      userId: result.lastID
    });
  } catch (error) {
    console.error('❌ Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const db = await getDatabase();

    // Buscar usuário
    const user = await db.get('SELECT * FROM users WHERE email = ?', email) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = generateToken(user.id);

    console.log(`✅ Login bem-sucedido: ${email}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const db = await getDatabase();
    const user = await db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', req.userId) as Omit<User, 'password_hash'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Erro ao obter dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
