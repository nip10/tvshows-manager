import { createServer } from 'http';
import app from './app';

const { PORT, NODE_ENV } = process.env;

function normalizePort(val) {
    const p = parseInt(val, 10);
    if (Number.isNaN(p)) {
        return val;
    }
    if (p >= 0) {
        return p;
    }
    return false;
}

const port = normalizePort(PORT || '3000');
app.set('port', port);

const server = createServer(app);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
    case 'EACCES':
        console.log(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.log(`${bind} is already in use`);
        process.exit(1);
        break;
    default:
        throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening on ${bind} in ${NODE_ENV} mode`);
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
