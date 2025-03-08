import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Initialize NestJS app
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    // Inject env variables
    app.use((req, res, next) => {
      req.env = env;
      next();
    });
    
    // Initialize the app
    await app.init();
    
    try {
      // Create the URL object
      const url = new URL(request.url);
      const path = url.pathname + url.search;
      
      // Get HTTP adapter
      const httpAdapter = app.getHttpAdapter();
      const server = httpAdapter.getHttpServer();
      
      // Create a custom response object that captures the response
      let statusCode = 200;
      let responseHeaders = {};
      let responseBody = '';
      
      const response = {
        status: (code) => {
          statusCode = code;
          return response;
        },
        set: (header, value) => {
          responseHeaders[header] = value;
          return response;
        },
        send: (body) => {
          responseBody = body;
          return response;
        },
        json: (body) => {
          responseHeaders['Content-Type'] = 'application/json';
          responseBody = JSON.stringify(body);
          return response;
        },
        end: () => {
          return response;
        },
        getHeader: (name) => responseHeaders[name],
        setHeader: (name, value) => {
          responseHeaders[name] = value;
          return response;
        }
      };
      
      // Convert the Cloudflare request to an Express-like request
      const method = request.method;
      const headers = Object.fromEntries(request.headers.entries());
      const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined;
      
      // Call the app's routing system directly
      await new Promise<void>((resolve) => {
        // Create an Express-like request object
        const req = {
          method,
          url: path,
          path,
          headers,
          body,
          params: {},
          query: Object.fromEntries(url.searchParams.entries()),
          env,
          // Add these for Express compatibility
          protocol: url.protocol.replace(':', ''),
          hostname: url.hostname,
          ip: request.headers.get('cf-connecting-ip') || '',
          rawBody: body,
        };
        
        // Create a resolver function that will be called after response is ready
        response.end = () => {
          resolve();
          return response;
        };
        
        // Use the app instance to route the request
        // This bypasses the httpAdapter.handle method that doesn't exist
        app.getHttpAdapter().getInstance().handle(req, response);
      });
      
      // Convert the captured response to a Cloudflare Worker response
      return new Response(responseBody, {
        status: statusCode,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`Server error: ${error.message}`, { status: 500 });
    }
  }
};