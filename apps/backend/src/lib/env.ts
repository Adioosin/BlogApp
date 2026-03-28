const requiredVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
] as const;

type EnvVarName = (typeof requiredVars)[number];

function validateEnv(): void {
  const missing: string[] = [];
  for (const name of requiredVars) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function env(name: EnvVarName): string {
  return process.env[name]!;
}

export { validateEnv, env };
