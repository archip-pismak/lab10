const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 3000;
const rootDir = __dirname;
const databasePath = path.join(rootDir, 'db.json');

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  response.end(JSON.stringify(data));
}

function sendFile(response, filePath, contentType) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 500, { error: 'Не вдалося прочитати файл сторінки.' });
      return;
    }

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
}

function getCart(cartId) {
  const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  return database.carts.find(cart => cart.id === cartId);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    response.end();
    return;
  }

  const cartMatch = requestUrl.pathname.match(/^\/carts\/(\d+)$/);
  if (request.method === 'GET' && cartMatch) {
    const cartId = Number(cartMatch[1]);
    const cart = getCart(cartId);
    const delay = Math.min(Math.max(Number(requestUrl.searchParams.get('delay')) || 0, 0), 10000);

    setTimeout(() => {
      if (!cart) {
        sendJson(response, 404, { error: `Кошик з ID ${cartId} не знайдено.` });
        return;
      }

      sendJson(response, 200, cart);
    }, delay);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/carts') {
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    sendJson(response, 200, database.carts);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/') {
    sendFile(response, path.join(rootDir, 'index.html'), 'text/html; charset=utf-8');
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/script.js') {
    sendFile(response, path.join(rootDir, 'script.js'), 'text/javascript; charset=utf-8');
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/style.css') {
    sendFile(response, path.join(rootDir, 'style.css'), 'text/css; charset=utf-8');
    return;
  }

  sendJson(response, 404, { error: 'Маршрут не знайдено.' });
});

server.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
  console.log(`Кошики: http://localhost:${PORT}/carts`);
});
