import dotenv from 'dotenv';

dotenv.config();

import { validateEnv } from './lib/env.js';

validateEnv();

import { app } from './app.js';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
