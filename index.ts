import { groqService } from './services/groq';
import type { AIService, ChatMessage } from './types';
import { cerebrasService } from './services/cerebras';

const services: AIService[] = [
    groqService,
    cerebrasService,
]
let currentServiceIndex = 0;

function getNextService() {
    const service = services[currentServiceIndex];
    currentServiceIndex = (currentServiceIndex + 1) % services.length;
    return service;
}

const server = Bun.serve({
    port: process.env.PORT ?? 3000,
    async fetch(req) {
        const { pathname } = new URL(req.url)

        // Servir archivos estáticos
        if (pathname === '/' || pathname === '/index.html') {
            const file = Bun.file('./public/index.html');
            return new Response(file, {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        if (pathname.startsWith('/')) {
            const filePath = `./public${pathname}`;
            const file = Bun.file(filePath);
            
            if (await file.exists()) {
                const contentType = getContentType(pathname);
                return new Response(file, {
                    headers: { 'Content-Type': contentType }
                });
            }
        }

        // Endpoint de chat
        if (req.method === 'POST' && pathname === '/chat') {
            const { messages } = await req.json() as { messages: ChatMessage[] };
            const service = getNextService();

            console.log(`Using ${service?.name} service`);
            const stream = await service?.chat(messages);

            if (!stream) {
                return new Response("Service not available", { status: 503 });
            }

            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of stream) {
                            controller.enqueue(new TextEncoder().encode(chunk));
                        }
                        controller.close();
                    } catch (error) {
                        controller.error(error);
                    }
                }
            });

            return new Response(readableStream, {
                headers: {
                    'content-type': 'text/event-stream',
                    'cache-control': 'no-cache',
                    'connection': 'keep-alive',
                    'x-service': service?.name || 'unknown'
                }
            });
        }
        
        return new Response("Not found", { status: 404 });
    }
})

function getContentType(pathname: string): string {
    if (pathname.endsWith('.css')) return 'text/css';
    if (pathname.endsWith('.js')) return 'application/javascript';
    if (pathname.endsWith('.html')) return 'text/html';
    if (pathname.endsWith('.png')) return 'image/png';
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
    if (pathname.endsWith('.svg')) return 'image/svg+xml';
    return 'text/plain';
} 

console.log(`Server is running on ${server.url}`);

