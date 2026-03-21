import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import e from 'express';
import { table, time } from 'console';

const bearerToken = 'Bearer aaa.eyJzdWIiOiIxMjMifQ.bbb';
const token = bearerToken.slice(7); // Remove 'Bearer ' prefix

const parts = token.split('.'); // Split on '.'
const header = parts[0];
const payload = parts[1];
const signature = parts[2];

dotenv.config();
const DB_SCHEMA = process.env.DB_SCHEMA || app; 
const useSsl = process.env.PGSSLMODE === 'require';
const app = express(); 
app.use(cors());
app.use(express.json());
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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if(token) {
        console.log('TOKEN HAS A VALUE\n',
            `Bearer Token: ${bearerToken}\n`, 
            `Token: ${token}\n`,
            `Header: ${header}\n`,
            `Payload: ${payload}\n`,
            `Signature: ${signature}\n`);
    } else {
        console.log('No token provided');
    }
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
