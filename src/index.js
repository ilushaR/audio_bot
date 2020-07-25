import 'dotenv/config';
import express from 'express';
import { json } from 'body-parser';
import mainRouter from './routes';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(json());
app.use('/', mainRouter);

app.listen(process.env.PORT || 8080, () => console.log('Server is working'));
