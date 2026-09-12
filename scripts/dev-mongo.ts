// Lokalna baza MongoDB w pamieci do developmentu (bez instalacji Mongo).
// Uzycie: npm run dev:mongo  -> nasluchuje na mongodb://127.0.0.1:27017/benstal
// Dane znikaja po zatrzymaniu procesu.
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  const server = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'benstal' } });
  console.log(`MongoDB (in-memory) działa: ${server.getUri()}`);
  console.log('Ctrl+C aby zatrzymać.');
  const stop = async () => {
    await server.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
