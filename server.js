// server.js - Backend minimal pour l'application
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Configuration CORS explicite
app.use(cors({
  origin: '*',  // Accepter toutes les origines en dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// --- Endpoint de test ---
app.get('/test', (req, res) => {
  res.json({ message: 'Backend est en ligne! ✅' });
});

// --- Génération de token ---
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

// --- Auth: register / login ---
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Utilisateur déjà existant' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hash } });
    const token = generateToken(user);

    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = generateToken(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Middleware d’authentification ---
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non autorisé' });

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: payload.id } });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// --- Projects ---
app.post('/projects', authMiddleware, async (req, res) => {
  try {
    const { title, description, goal, category, image } = req.body;
    if (!title || !goal || parseFloat(goal) <= 0) {
      return res.status(400).json({ error: 'Titre valide et objectif > 0 requis' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        goal: parseFloat(goal),
        category,
        image,
        ownerId: req.user.id,
        status: 'PENDING',
        currentAmount: 0
      }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(400).json({ error: 'Erreur lors de la création du projet' });
  }
});

app.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ include: { owner: true } });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/projects/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: { owner: true, investments: true }
  });
  if (!project) return res.status(404).json({ error: 'Projet introuvable' });
  res.json(project);
});

// --- Investissements ---
app.post('/projects/:id/invest', authMiddleware, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { amount } = req.body;
  if (!amount || isNaN(parseFloat(amount))) return res.status(400).json({ error: 'Montant invalide' });

  try {
    const result = await prisma.$transaction([
      prisma.investment.create({ data: { amount: parseFloat(amount), userId: req.user.id, projectId } }),
      prisma.project.update({ where: { id: projectId }, data: { currentAmount: { increment: parseFloat(amount) } } })
    ]);
    res.json({ message: 'Investissement réussi', result });
  } catch (err) {
    console.error('Invest error:', err);
    res.status(500).json({ error: 'Échec de l’investissement' });
  }
});

// --- Admin routes ---
app.get('/admin/pending-projects', authMiddleware, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Accès admin requis' });
  try {
    const pending = await prisma.project.findMany({ where: { status: 'PENDING' }, include: { owner: true } });
    res.json(pending);
  } catch (err) {
    console.error('Admin pending projects error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/admin/projects/:id/approve', authMiddleware, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Accès admin requis' });
  const id = parseInt(req.params.id);
  try {
    const project = await prisma.project.update({ where: { id }, data: { status: 'ACTIVE' } });
    res.json({ message: 'Projet approuvé', project });
  } catch (err) {
    console.error('Approve project error:', err);
    res.status(400).json({ error: 'Impossible d’approuver le projet' });
  }
});

// --- Conditions d’utilisation ---
app.get('/terms', (req, res) => {
  res.json({
    title: "Conditions d’utilisation",
    content: [
      "1. Objet : La plateforme a pour but de fournir un soutien académique et pratique aux étudiants.",
      "2. Inscription : Chaque utilisateur doit fournir des informations exactes lors de son inscription.",
      "3. Utilisation : Les utilisateurs s’engagent à utiliser la plateforme uniquement à des fins éducatives et collaboratives.",
      "4. Responsabilité : La plateforme met à disposition des ressources et conseils, mais ne garantit pas la réussite académique.",
      "5. Confidentialité : Les données personnelles des utilisateurs sont protégées.",
      "6. Investissements : Les contributions financières servent exclusivement au développement et à l’amélioration du projet.",
      "7. Modification : Les présentes conditions peuvent être mises à jour."
    ]
  });
});

// --- Politique de confidentialité ---
app.get('/privacy', (req, res) => {
  res.json({
    title: "Politique de confidentialité",
    content: [
      "1. Collecte des données : Nous recueillons uniquement les informations nécessaires à l’inscription et à l’utilisation de la plateforme.",
      "2. Utilisation des données : Les données sont utilisées pour fournir les services éducatifs et améliorer l’expérience utilisateur.",
      "3. Partage des données : Les informations personnelles ne sont jamais partagées avec des tiers sans consentement explicite.",
      "4. Sécurité : Nous mettons en place des mesures techniques pour protéger les données contre tout accès non autorisé.",
      "5. Droits des utilisateurs : Chaque utilisateur peut demander la modification ou la suppression de ses données personnelles.",
      "6. Modifications : La présente politique peut être mise à jour. Les utilisateurs seront informés des changements importants."
    ]
  });
});

// --- Route 404 (à mettre en dernier) ---
app.use((req, res) => res.status(404).json({ error: 'Route non trouvée' }));

// --- Démarrage du serveur ---
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
