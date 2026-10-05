import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {createGroqResponse} from './server/groqHandler';
import {handleAdminLogin} from './server/adminAuthHandler';

const adminAuthApiPlugin = () => ({
  name: 'sangsan-admin-auth-api',
  configureServer(server: any) {
    server.middlewares.use('/api/admin-login', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'Method not allowed.' }));
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
        }
        const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        const result = handleAdminLogin(input);
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      } catch (error) {
        console.error('[AdminLogin] dev request failed:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'Internal server error.' }));
      }
    });
  }
});

const groqApiPlugin = () => ({
  name: 'sangsan-groq-api',
  configureServer(server: any) {
    server.middlewares.use('/api/groq', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed.' }));
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
        }
        const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        const authHeader = req.headers?.authorization;
        const token =
          typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : (req.headers?.['x-session-token'] as string) || input?.token || input?.sessionToken;
        const ip =
          (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket?.remoteAddress ||
          '127.0.0.1';

        const result = await createGroqResponse(input, { token, ip });
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      } catch (error) {
        console.error('[Groq] dev request failed:', error);
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Groq request failed.' }));
      }
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), groqApiPlugin(), adminAuthApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Allow proxied development previews across Replit and Google AI Studio.
      // This server-only setting does not affect the Vercel production build.
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
