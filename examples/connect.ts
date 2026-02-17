import { QBittorrent } from '../packages/core/src/index';

const qbit = new QBittorrent({
  baseURL: 'http://localhost:9091/api/v2'
  // username: 'admin',
  // password: '123456'
});

console.log('API Version', await qbit.getApiVersion());
console.log('APP Version', await qbit.getApplicationVersion());
console.log('Cookie', qbit.state.auth);
