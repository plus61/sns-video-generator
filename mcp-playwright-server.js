#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit } from '@playwright/test';

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.browsers = new Map();
    this.pages = new Map();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'launch_browser',
            description: 'Launch a browser instance (chromium, firefox, webkit)',
            inputSchema: {
              type: 'object',
              properties: {
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser type to launch'
                },
                headless: {
                  type: 'boolean',
                  description: 'Run browser in headless mode',
                  default: true
                }
              },
              required: ['browser']
            }
          },
          {
            name: 'goto',
            description: 'Navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to'
                },
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID'
                }
              },
              required: ['url', 'browserId']
            }
          },
          {
            name: 'screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID'
                },
                path: {
                  type: 'string',
                  description: 'File path to save screenshot'
                }
              },
              required: ['browserId']
            }
          },
          {
            name: 'click',
            description: 'Click an element by selector',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector or text content'
                },
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID'
                }
              },
              required: ['selector', 'browserId']
            }
          },
          {
            name: 'fill',
            description: 'Fill an input field',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the input field'
                },
                value: {
                  type: 'string',
                  description: 'Value to fill in the field'
                },
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID'
                }
              },
              required: ['selector', 'value', 'browserId']
            }
          },
          {
            name: 'get_text',
            description: 'Get text content from an element',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element'
                },
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID'
                }
              },
              required: ['selector', 'browserId']
            }
          },
          {
            name: 'wait_for_selector',
            description: 'Wait for an element to appear',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector to wait for'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in milliseconds',
                  default: 30000
                },
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID'
                }
              },
              required: ['selector', 'browserId']
            }
          },
          {
            name: 'close_browser',
            description: 'Close a browser instance',
            inputSchema: {
              type: 'object',
              properties: {
                browserId: {
                  type: 'string',
                  description: 'Browser instance ID to close'
                }
              },
              required: ['browserId']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'launch_browser':
            return await this.launchBrowser(args);
          case 'goto':
            return await this.goto(args);
          case 'screenshot':
            return await this.screenshot(args);
          case 'click':
            return await this.click(args);
          case 'fill':
            return await this.fill(args);
          case 'get_text':
            return await this.getText(args);
          case 'wait_for_selector':
            return await this.waitForSelector(args);
          case 'close_browser':
            return await this.closeBrowser(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async launchBrowser(args) {
    const { browser: browserType, headless = true } = args;
    const browserId = `${browserType}-${Date.now()}`;
    
    let browser;
    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch({ headless });
        break;
      case 'firefox':
        browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless });
        break;
      default:
        throw new Error(`Unsupported browser: ${browserType}`);
    }
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.browsers.set(browserId, { browser, context });
    this.pages.set(browserId, page);
    
    return {
      content: [{
        type: 'text',
        text: `Browser ${browserType} launched successfully with ID: ${browserId}`
      }]
    };
  }

  async goto(args) {
    const { url, browserId } = args;
    const page = this.pages.get(browserId);
    
    if (!page) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    await page.goto(url);
    
    return {
      content: [{
        type: 'text',
        text: `Navigated to ${url}`
      }]
    };
  }

  async screenshot(args) {
    const { browserId, path } = args;
    const page = this.pages.get(browserId);
    
    if (!page) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    const screenshotPath = path || `screenshot-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    
    return {
      content: [{
        type: 'text',
        text: `Screenshot saved to ${screenshotPath}`
      }]
    };
  }

  async click(args) {
    const { selector, browserId } = args;
    const page = this.pages.get(browserId);
    
    if (!page) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    await page.click(selector);
    
    return {
      content: [{
        type: 'text',
        text: `Clicked element: ${selector}`
      }]
    };
  }

  async fill(args) {
    const { selector, value, browserId } = args;
    const page = this.pages.get(browserId);
    
    if (!page) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    await page.fill(selector, value);
    
    return {
      content: [{
        type: 'text',
        text: `Filled ${selector} with: ${value}`
      }]
    };
  }

  async getText(args) {
    const { selector, browserId } = args;
    const page = this.pages.get(browserId);
    
    if (!page) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    const text = await page.textContent(selector);
    
    return {
      content: [{
        type: 'text',
        text: `Text content: ${text}`
      }]
    };
  }

  async waitForSelector(args) {
    const { selector, timeout = 30000, browserId } = args;
    const page = this.pages.get(browserId);
    
    if (!page) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    await page.waitForSelector(selector, { timeout });
    
    return {
      content: [{
        type: 'text',
        text: `Element ${selector} appeared`
      }]
    };
  }

  async closeBrowser(args) {
    const { browserId } = args;
    const browserData = this.browsers.get(browserId);
    
    if (!browserData) {
      throw new Error(`Browser with ID ${browserId} not found`);
    }
    
    await browserData.browser.close();
    this.browsers.delete(browserId);
    this.pages.delete(browserId);
    
    return {
      content: [{
        type: 'text',
        text: `Browser ${browserId} closed successfully`
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP Server running on stdio');
  }
}

const server = new PlaywrightMCPServer();
server.run().catch(console.error);