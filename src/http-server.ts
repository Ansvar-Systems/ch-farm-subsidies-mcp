import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase, type Database } from './db.js';
import { handleAbout } from './tools/about.js';
import { handleListSources } from './tools/list-sources.js';
import { handleCheckFreshness } from './tools/check-freshness.js';
import { handleSearchSchemes } from './tools/search-schemes.js';
import { handleGetSchemeDetails } from './tools/get-scheme-details.js';
import { handleGetPaymentRates } from './tools/get-payment-rates.js';
import { handleCheckEligibility } from './tools/check-eligibility.js';
import { handleListSchemeOptions } from './tools/list-scheme-options.js';
import { handleGetOelnRequirements } from './tools/get-oeln-requirements.js';
import { handleSearchApplicationGuidance } from './tools/search-application-guidance.js';

const SERVER_NAME = 'ch-farm-subsidies-mcp';
const SERVER_VERSION = '0.1.0';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const SearchArgsSchema = z.object({
  query: z.string(),
  scheme_type: z.string().optional(),
  jurisdiction: z.string().optional(),
  limit: z.number().optional(),
});

const SchemeDetailsArgsSchema = z.object({
  scheme_id: z.string(),
  jurisdiction: z.string().optional(),
});

const PaymentRatesArgsSchema = z.object({
  scheme_id: z.string(),
  zone: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const EligibilityArgsSchema = z.object({
  land_type: z.string(),
  zone: z.string().optional(),
  farm_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const ListSchemeOptionsArgsSchema = z.object({
  scheme_id: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const OelnArgsSchema = z.object({
  requirement_id: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const GuidanceArgsSchema = z.object({
  query: z.string(),
  jurisdiction: z.string().optional(),
});

const TOOLS = [
  {
    name: 'about',
    description: 'Get server metadata: name, version, coverage, data sources, and links.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_sources',
    description: 'List all data sources with authority, URL, license, and freshness info.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'check_data_freshness',
    description: 'Check when data was last ingested, staleness status, and how to trigger a refresh.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_schemes',
    description: 'Search across all Swiss direct payment schemes (Direktzahlungen). Use for broad queries about subsidies, payments, and agricultural support programmes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query (German, French, or English)' },
        scheme_type: { type: 'string', description: 'Filter by scheme type (e.g. kulturlandschaft, versorgungssicherheit, biodiversitaet)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
        limit: { type: 'number', description: 'Max results (default: 20, max: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_scheme_details',
    description: 'Get full details for a specific direct payment scheme: requirements, rates by zone, legal basis.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        scheme_id: { type: 'string', description: 'Scheme ID (e.g. kulturlandschaft-hangbeitrag, versorgung-basis-acker)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['scheme_id'],
    },
  },
  {
    name: 'get_payment_rates',
    description: 'Get payment rates for a scheme, optionally filtered by altitude zone. Returns CHF rates per unit.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        scheme_id: { type: 'string', description: 'Scheme ID' },
        zone: { type: 'string', description: 'Altitude zone (e.g. talzone, huegelzone, bergzone_i)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['scheme_id'],
    },
  },
  {
    name: 'check_eligibility',
    description: 'Check which direct payment schemes a farm is eligible for, based on land type, zone, and farm type.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        land_type: { type: 'string', description: 'Land type (e.g. offene Ackerflaeche, Dauergruenland, BFF)' },
        zone: { type: 'string', description: 'Altitude zone (default: talzone)' },
        farm_type: { type: 'string', description: 'Farm type (e.g. Bio, Extenso, konventionell)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['land_type'],
    },
  },
  {
    name: 'list_scheme_options',
    description: 'List all options within a payment category, or all categories if no scheme_id given.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        scheme_id: { type: 'string', description: 'Scheme ID to get sub-options. Omit to list all categories.' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_oeln_requirements',
    description: 'Get OELN (Oekologischer Leistungsnachweis) requirements — prerequisite for all Swiss direct payments.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        requirement_id: { type: 'string', description: 'Requirement number (1-12) or omit to list all' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'search_application_guidance',
    description: 'Search Agate portal filing guidance: deadlines, application process, common mistakes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query about application process' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['query'],
    },
  },
];

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

function registerTools(server: Server, db: Database): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case 'about':
          return textResult(handleAbout());
        case 'list_sources':
          return textResult(handleListSources(db));
        case 'check_data_freshness':
          return textResult(handleCheckFreshness(db));
        case 'search_schemes':
          return textResult(handleSearchSchemes(db, SearchArgsSchema.parse(args)));
        case 'get_scheme_details':
          return textResult(handleGetSchemeDetails(db, SchemeDetailsArgsSchema.parse(args)));
        case 'get_payment_rates':
          return textResult(handleGetPaymentRates(db, PaymentRatesArgsSchema.parse(args)));
        case 'check_eligibility':
          return textResult(handleCheckEligibility(db, EligibilityArgsSchema.parse(args)));
        case 'list_scheme_options':
          return textResult(handleListSchemeOptions(db, ListSchemeOptionsArgsSchema.parse(args)));
        case 'get_oeln_requirements':
          return textResult(handleGetOelnRequirements(db, OelnArgsSchema.parse(args)));
        case 'search_application_guidance':
          return textResult(handleSearchApplicationGuidance(db, GuidanceArgsSchema.parse(args)));
        default:
          return errorResult(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  });
}

const db = createDatabase();
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

function createMcpServer(): Server {
  const mcpServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
  registerTools(mcpServer, db);
  return mcpServer;
}

async function handleMCPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
    return;
  }

  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
    mcpServer.close().catch(() => {});
  };

  await transport.handleRequest(req, res);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { transport, server: mcpServer });
  }
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', server: SERVER_NAME, version: SERVER_VERSION }));
    return;
  }

  if (url.pathname === '/mcp' || url.pathname === '/') {
    try {
      await handleMCPRequest(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`${SERVER_NAME} v${SERVER_VERSION} listening on port ${PORT}`);
});
