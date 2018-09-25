import {
  argon2u,
  fullWalletFromTicket,
  childNodeFromSeed,
  childSeedFromSeed,
  walletFromSeed,
  urbitKeysFromSeed,
  shardWallet,
  combine,
  _buf2hex,
  _hex2buf,
  _shard,
  _combine,
  _shardBuffer,
  _combineBuffer
} from '../src/index'

test('argon2u', async () => {
  let res = await argon2u({
    entropy: 'password123',
    seedSize: 64,
  })
  expect(res).toBeDefined();
})

test('child seed from seed', async () => {
  let res = await childSeedFromSeed({
    seed: 'some seed',
    type: 'type',
    revision: 0
  });
  expect(_buf2hex(res)).toBe('b150354a72552c9efd');
  //
  res = await childSeedFromSeed({
    seed: 'some seed!',
    type: 'type',
    revision: 0
  });
  expect(_buf2hex(res)).toBe('d613009d343cfc90b471');
  //
  res = await childSeedFromSeed({
    seed: 'some seed',
    type: 'type',
    revision: 0,
    ship: 2
  });
  expect(_buf2hex(res)).toBe('b50817d05c920fa6b3');
  //
  let res2 = await childSeedFromSeed({
    seed: 'some seed',
    type: 'type',
    revision: 0,
    ship: 2,
    password: ''
  });
  expect(res2).toEqual(res);
  //
  res = await childSeedFromSeed({
    seed: 'some seed',
    type: 'type',
    revision: 0,
    ship: 2,
    password: 'pass'
  });
  expect(_buf2hex(res)).toBe('8ccb09374028018690');
});

test('wallet from seed', async () => {
  let res = await walletFromSeed('some seed');
  expect(res).toEqual({
    public: '02bb80a59fd51ed853285f3b7738b4542f619a52819a04680e5f36c4d76547eec9',
    private: '733fce1a6a6dc99641590a454532298423c2c65f0df30ca070698d92df55196e',
    chain: 'ef2ccb72ef656cef2256d5fb0a43bbfab04ced88366876580e34e4e57c96c48c'
  });
  //
  let res2 = await walletFromSeed('some seed', '');
  expect(res2).toEqual(res);
  //
  res = await walletFromSeed('some seed', 'pass');
  expect(res).toEqual({
    public: '0201239b9f2b940f7ce29d19633f66bcdd46ddb647812921562aa1e402584cb0a6',
    private: 'f551b64d202e4749d86953d4aa2ee5252093fb335853104bfdd44360c3b95032',
    chain: 'd3ad3620177f98d600c173a30b9a57074dede600ded508b487f29359c684c3dc'
  });
});

test('child node from seed', async () => {
  let res = await childNodeFromSeed({
    seed: 'some seed',
    type: 'type',
    revision: 0
  });
  expect(res.meta).toEqual({type: 'type', revision: 0, ship: null});
  expect(res.seed).toBe('b150354a72552c9efd');
  expect(res.keys).toEqual({
    public: '03e68b2b5410be60afa3a28de9815c9357bfada54baf9aa75e8544cc98ac9b0a0b',
    private: '2a3d0c6fcb30168546e4dc86e03ac09f6740f5e1f687a78efcd8a81b233b161f',
    chain: 'cb7a53bce7d0329b3bede0c3acb39d05e0001acf53d9904492b00b3a575cb03a'
  });
  //
  res = await childNodeFromSeed({
    seed: 'some seed',
    type: 'type',
    revision: 0,
    ship: 2,
    password: 'pass'
  });
  expect(res.meta).toEqual({type: 'type', revision: 0, ship: 2});
  expect(res.seed).toBe('8ccb09374028018690');
  expect(res.keys).toEqual({
    public: '031d0aa7c921fe64db6bba7bfeca1ba522960602d18909976d349110856634d779',
    private: 'cce1477c8039b14bf995f68ef640e3ead75dbdc762507dc63c61d1963d654d13',
    chain: '5d20c3a604709b932dc7a6298f37bdc713d64e65f1756e17b4624be601baf379'
  });
});

test('urbit keys from seed', async () => {
  let seed = Buffer.from('some seed');
  let res = urbitKeysFromSeed(seed, Buffer.from(''));
  expect(res.crypt).toEqual({
    private: '15ef9b020606faf25dd4b622d34a5f2ba83e3498f78e35c6d256379f4871391e',
    public: '220c0db4f436d2532f0fddb56555bf6926d6bcfb073d790b8f1e9c4258ebb43e'
  });
  expect(res.auth).toEqual({
    private: 'fd816b63558f3f4ee5eafedbabe56293ee1f64e837f081724bfdd47d6e4b9815',
    public: 'bbba375a6dd28dc9e44d6a98c75edeb699c10d78e92ccad78c892efa2466c666'
  });
  //
  res = urbitKeysFromSeed(seed, Buffer.from('pass'));
  expect(res.crypt).toEqual({
    private: 'e3ec05249eaaffbfca918dd9048a03656b68e5685f9a2452850917e2b34996ed',
    public: 'edb31a2d442b50d37983ac06ab7c5d976a71eca84ed16573bf6e258b082ea9f9'
  });
  expect(res.auth).toEqual({
    private: '5dee3371f15af6dfdd4c8c50037c3f3350e26440af3257ed62f9da9445e9946b',
    public: '9b4931daf2c0cccd34df0772f70eaaa9b5b341c46e1a8cbf063b7cdd25917e13'
  });
});

test('full wallet from ticket, no boot', async () => {
  const ticket = Buffer.from('my awesome urbit ticket, i am so lucky');
  const seedSize = 16;

  const config = {
    ticket: ticket,
    seedSize: seedSize,
    ships: [1],
    boot: false,
  };

  const seed = await argon2u(ticket, seedSize)
  const wallet = await fullWalletFromTicket(config);

  expect(wallet.owner.seed).toEqual(seed.hashHex);
  expect(wallet.network).toEqual([])

  const hexTicket = _buf2hex(ticket)
  expect(wallet.ticket).toEqual(hexTicket)
});

test('full wallet from ticket, boot', async () => {
  const ticket = Buffer.from('my awesome urbit ticket, i am so lucky');
  const seedSize = 16;

  const config = {
    ticket: ticket,
    seedSize: seedSize,
    ships: [1],
    password: '',
    revisions: {},
    boot: true,
  };

  const res = await fullWalletFromTicket(config);
  expect(res.network).toEqual([{
    keys: {
      auth: {
        private: 'c519fb1687dc6d7db85feb50d92182a949d82a5b364d8524ecaf96466f81060f',
        public: '0e6897618be422b7c318a5587203a79625a3fd587043c2bca2e9c15d9763ac07'
      },
      crypt: {
        private: '14c82b023664de0f4d03487c3701b129b37c1fd06bd2af15caf7167c953ce1e3',
        public: '7a0be8acabf20ebee63f62595a2c38f0c6e1a69274532c3a125de1cc96479a75'
      }
    },
    meta: {
      revision: 0,
      ship: 1,
      type: "network"
    },
    seed: '80b602c7b70dafc88194ef3b6d156c7d0da3db121c523734c88fcc84d452d2ce'
  }]);

  const hexTicket = _buf2hex(ticket)
  expect(res.ticket).toEqual(hexTicket)
});

test('sharding internals: buf2hex and hex2buf are inverses', async () => {
  const hex0 = 'dd0fa088041973131739a033dddc668ce692';
  const buf0 = _hex2buf(hex0);
  const inv0 = _buf2hex(buf0);
  expect(inv0).toEqual(hex0);

  const hex1 = '7468697320697320612074c3a97374';
  const buf1 = _hex2buf(hex1);
  const inv1 = _buf2hex(buf1);
  expect(inv1).toEqual(hex1);

  const buf2 = Buffer.from([54, 65, 105, 225, 146, 251, 171, 131,
                            56, 4, 132, 194, 99, 111, 78, 171]);
  const hex2 = _buf2hex(buf2);
  const inv2 = _hex2buf(hex2);
  expect(buf2).toEqual(inv2);
});

test('sharding internals: combineBuffer . shardBuffer ~ id', async () => {
  const arr0 = [54, 65, 105, 225, 146, 251, 171, 131,
                56, 4, 132, 194, 99, 111, 78, 171];

  const buf0 = Buffer.from(arr0);
  const shards0 = _shardBuffer(buf0);
  const combined0 = _combineBuffer(shards0);

  expect(combined0).toEqual(buf0);

  const arr1 = [ 8, 42, 39, 159, 26, 44, 25, 220, 244, 101, 101, 167, 204, 196,
                 51, 125, 117, 26, 6, 159, 145, 25, 68, 100, 41, 105, 157, 226,
                 154, 61, 19, 250 ];

  const buf1 = Buffer.from(arr1);
  const shards1 = _shardBuffer(buf1);
  const combined1 = _combineBuffer(shards1);

  expect(combined1).toEqual(buf1);
});

test('sharding internals: combine . shard ~ id', async () => {
  const original0 = '736f6d652073656564';
  let shards = _shard(original0);
  let slice0 = shards.slice(0, 2);
  let slice1 = shards.slice(1, 3);
  let slice2 = shards.slice(0, 1).concat(shards.slice(2, 3));
  let reconstructed = _combine(slice0)
  expect(reconstructed).toEqual(original0);
  reconstructed = _combine(slice1);
  expect(reconstructed).toEqual(original0);
  reconstructed = _combine(slice2);
  expect(reconstructed).toEqual(original0);

  const original1 = '544a22a7a9de737a1ed342cb1f03158314ecee7d364550daf27990cdacb9a7ea';
  shards = _shard(original1);
  slice0 = shards.slice(0, 2);
  slice1 = shards.slice(1, 3);
  slice2 = shards.slice(0, 1).concat(shards.slice(2, 3));
  reconstructed = _combine(slice0)
  expect(reconstructed).toEqual(original1);
  reconstructed = _combine(slice1);
  expect(reconstructed).toEqual(original1);
  reconstructed = _combine(slice2);
  expect(reconstructed).toEqual(original1);

  const original2 = '02bb80a59fd51ed853285f3b7738b4542f619a52819a04680e5f36c4d76547eec9'
  shards = _shard(original2);
  slice0 = shards.slice(0, 2);
  slice1 = shards.slice(1, 3);
  slice2 = shards.slice(0, 1).concat(shards.slice(2, 3));
  reconstructed = _combine(slice0)
  expect(reconstructed).toEqual(original2);
  reconstructed = _combine(slice1);
  expect(reconstructed).toEqual(original2);
  reconstructed = _combine(slice2);
  expect(reconstructed).toEqual(original2);

});

test('sharded wallet from seed', async () => {
  let ticket = Buffer.from('some ticket or other');

  const config0 = {
    ticket: ticket,
    seedSize: 16,
    ships: [1],
    password: '',
    revisions: {},
    boot: false
  };
  const original0 = '736f6d65207469636b6574206f72206f74686572';
  let res = await fullWalletFromTicket(config0);
  let sharded = shardWallet(res).ticket;
  let slice0 = sharded.slice(0, 2);
  let slice1 = sharded.slice(1, 3);
  let slice2 = sharded.slice(0, 1).concat(sharded.slice(2, 3));
  let reconstructed = _combine(slice0);
  expect(reconstructed).toEqual(original0);
  reconstructed = _combine(slice1);
  expect(reconstructed).toEqual(original0);
  reconstructed = _combine(slice2);
  expect(reconstructed).toEqual(original0);

  ticket = Buffer.from('a way longer ticket, even longer than before')
  const config1 = {
    ticket: ticket,
    seedSize: 16,
    ships: [1, 10, 900000],
    password: 'foo',
    revisions: {},
    boot: true
  };
  const original1 = '6120776179206c6f6e676572207469636b65742c206576656e206c6f6e676572207468616e206265666f7265';
  res = await fullWalletFromTicket(config1);
  sharded = shardWallet(res).ticket;
  slice0 = sharded.slice(0, 2);
  slice1 = sharded.slice(1, 3);
  slice2 = sharded.slice(0, 1).concat(sharded.slice(2, 3));
  reconstructed = _combine(slice0);
  expect(reconstructed).toEqual(original1);
  reconstructed = _combine(slice1);
  expect(reconstructed).toEqual(original1);
  reconstructed = _combine(slice2);
  expect(reconstructed).toEqual(original1);
});
