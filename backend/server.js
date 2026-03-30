import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import * as jose from 'jose';

dotenv.config();
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const useSsl = process.env.PGSSLMODE === 'require';
const app = express(); 

// Asgardeo JWKS URL for JWT verification (must match the org in main.jsx baseUrl)
const ASGARDEO_ORG = process.env.ASGARDEO_ORG || '';
const ASGARDEO_AUDIENCE = process.env.ASGARDEO_AUDIENCE || '';
const ASGARDEO_ISSUER = process.env.ASGARDEO_ISSUER || '';
const JWKS_URI = `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`;

//Middleware
app.use(cors());
app.use(express.json());

// JWT auth: verify Bearer token with Asgardeo JWKS, set req.userId from payload.sub
async function authMiddleware(req, res, next) {
    if (!ASGARDEO_ORG || !ASGARDEO_AUDIENCE || !ASGARDEO_ISSUER) {
        return res.status(500).json({
            error: 'Auth server configuration is incomplete.',
            detail: 'Set ASGARDEO_ORG, ASGARDEO_AUDIENCE, and ASGARDEO_ISSUER in backend .env',
        });
    }

  const authHeader = (req.headers.authorization || '').trim();

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing auth',
      detail: 'Send Authorization: Bearer <access_token>',
    });
  }

  const token = authHeader.slice(7).trim();
  const looksLikeJwt = token && token.split('.').length === 3;

  if (!looksLikeJwt) {
    return res.status(401).json({
      error: 'Access token is not a JWT. In Asgardeo, set your app to use JWT access tokens (Protocol tab).',
    });
  }

  try {
    const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URI));
        const { payload } = await jose.jwtVerify(token, JWKS, {
            issuer: ASGARDEO_ISSUER,
            audience: ASGARDEO_AUDIENCE,
        });
    req.userId = payload.sub; // Asgardeo's unique user id → used for row-level auth
    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message,
    });
  }
}


const server = createServer(app);

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER,
process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl
    ? {
        ssl: {
            require: true,
            rejectUnauthorized: false,
            },
        }
        : undefined,
    define: {
        schema: DB_SCHEMA,
    },
});

const User = sequelize.define('puppies', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        notNull: true,
    },
    name: { 
        type: DataTypes.TEXT,
        notNull: true,
    },
    breed: { 
        type: DataTypes.TEXT,
        notNull: true,
    },
    age: { 
        type: DataTypes.INTEGER,
        notNull: true,
    }},
    {schema: DB_SCHEMA,
    tableName: 'puppies',
    timestamps: false,
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Get all puppies
app.get('/puppies', authMiddleware, async (req, res) => {
    try {
        const puppies = await User.findAll();   
        res.json(puppies);
    } catch (err) {
        console.error('Error fetching puppies: ', err);
        res.status(500).json({ error: 'Failed to fetch puppies' });
    }
});

// Get by ID
app.get('/puppies/:id', authMiddleware, async (req, res) => {
    try {
        const puppy = await User.findByPk(req.params.id);
        if (puppy) {
            res.json(puppy);
        } else {
            res.status(404).json({ error: 'Puppy not found' });
        }
    } catch (err) {
        console.error('Error fetching puppy: ', err);
        res.status(500).json({ error: 'Failed to fetch puppy' });
    }
});

// Put update by ID
app.put('/puppies/:id', authMiddleware, async (req, res) => {
    try { 
        const { name, breed, age } = req.body;
        const puppy = await User.findByPk(req.params.id);
        if (puppy) {
            puppy.name = name;
            puppy.breed = breed;
            puppy.age = age;
            await puppy.save();
            res.json(puppy);
        } else {
            res.status(404).json({ error: 'Puppy not found' });
        }
    } catch (err) {
        console.error('Error updating puppy: ', err);
        res.status(500).json({ error: 'Failed to update puppy' });
    }
});

// Delete by ID
app.delete('/puppies/:id', authMiddleware, async (req, res) => {
    try {
        const puppy = await User.findByPk(req.params.id);
        if (puppy) {
            await puppy.destroy();
            res.json({ message: 'Puppy deleted' });
        } else {
            res.status(404).json({ error: 'Puppy not found' });
        }
    } catch (err) {
        console.error('Error deleting puppy: ', err);
        res.status(500).json({ error: 'Failed to delete puppy' });
    }
});

app.post('/puppies', authMiddleware, async (req, res) => {
    try {
        const { name, breed, age } = req.body;

        const puppy = await User.create({ name, breed, age });
        res.status(201).json(puppy);
    } catch (err) {
        console.error('Error creating puppy: ', err);
        res.status(500).json({ error: 'Failed to create puppy' });
    }
});




const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await User.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error: ', err);
    process.exit(1);  // Exit with failure code
  }
};
startServer();
