const fs = require('fs');
const path = require('path');
const localtunnel = require('localtunnel');

const port = Number(process.env.PORT || 3000);
const urlFile = path.join(process.cwd(), '.localtunnel-url');

(async () => {
    const tunnel = await localtunnel({ port });
    fs.writeFileSync(urlFile, tunnel.url, 'utf8');
    console.log(`LocalTunnel ready: ${tunnel.url}`);

    tunnel.on('close', () => {
        console.log('LocalTunnel closed');
        process.exit(0);
    });
})().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
