import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import { json } from 'body-parser';
import mainRouter from './routes';
import cors from 'cors';
import morgan from 'morgan';

const privateKey = fs.readFileSync('private.key', 'utf8');
const certificate = fs.readFileSync('certificate.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const app = express();

app.use(cors());
app.options('*', cors());
app.use(morgan('common'));
app.use(json());
app.use('/', mainRouter);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(process.env.PORT || 8080);
httpsServer.listen(process.env.PORT_SECURE || 8443)
