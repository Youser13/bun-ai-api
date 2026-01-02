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
                }
            });
        }
        
        return new Response("Not found", { status: 404 });
    }
}) 

console.log(`Server is running on ${server.url}`);

