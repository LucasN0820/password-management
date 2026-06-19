/**
 * Bundled passphrase wordlist.
 *
 * A small, curated list of short, common, unambiguous English words (3–7
 * letters, all lowercase, no homophones-as-typos hazards). Words are selected
 * with a CSPRNG (see `secure-random.ts` → `generatePassphrase`).
 *
 * Size note: a 256-word list yields exactly `log2(256) = 8` bits of entropy per
 * word, so a 4-word passphrase ≈ 32 bits and a 6-word passphrase ≈ 48 bits. The
 * list is intentionally compact to keep the JS bundle small; the UI nudges
 * users toward more words rather than a larger list.
 */
export const WORDLIST: readonly string[] = [
  'able', 'acid', 'acre', 'aged', 'also', 'arch', 'area', 'army',
  'atom', 'aunt', 'axis', 'baby', 'back', 'bake', 'ball', 'band',
  'bank', 'barn', 'base', 'bath', 'bead', 'beam', 'bean', 'bear',
  'beat', 'bell', 'belt', 'bend', 'best', 'bike', 'bird', 'bite',
  'blue', 'boat', 'body', 'bone', 'book', 'boot', 'born', 'boss',
  'both', 'bowl', 'bulk', 'bush', 'busy', 'cafe', 'cage', 'cake',
  'calm', 'camp', 'cane', 'cape', 'card', 'care', 'cart', 'case',
  'cash', 'cast', 'cave', 'cell', 'chat', 'chef', 'chin', 'chip',
  'city', 'clad', 'clam', 'claw', 'clay', 'clip', 'club', 'clue',
  'coal', 'coat', 'code', 'coin', 'cold', 'colt', 'comb', 'cone',
  'cook', 'cool', 'cope', 'cord', 'core', 'cork', 'corn', 'cost',
  'cove', 'crab', 'crew', 'crop', 'crow', 'cube', 'curl', 'dash',
  'date', 'dawn', 'deal', 'dear', 'deck', 'deed', 'deep', 'deer',
  'desk', 'dial', 'dice', 'dirt', 'dish', 'dock', 'doll', 'dome',
  'door', 'dove', 'draw', 'drip', 'drop', 'drum', 'dual', 'duck',
  'dune', 'dusk', 'duty', 'each', 'earn', 'east', 'easy', 'echo',
  'edge', 'epic', 'face', 'fact', 'fade', 'fair', 'farm', 'fast',
  'fate', 'fawn', 'fern', 'film', 'find', 'fine', 'fire', 'fish',
  'five', 'flag', 'flat', 'flax', 'flip', 'flow', 'foam', 'fold',
  'fond', 'font', 'food', 'fork', 'form', 'fort', 'four', 'fuel',
  'gain', 'game', 'gate', 'gear', 'gift', 'girl', 'give', 'glad',
  'glow', 'glue', 'goal', 'goat', 'gold', 'golf', 'gone', 'good',
  'gown', 'grab', 'gray', 'grew', 'grid', 'grip', 'grow', 'gulf',
  'hail', 'half', 'hall', 'hand', 'hard', 'harp', 'hawk', 'haze',
  'head', 'heal', 'heap', 'heat', 'herb', 'herd', 'hero', 'hide',
  'hill', 'hint', 'hive', 'hold', 'hole', 'home', 'hood', 'hook',
  'hope', 'horn', 'host', 'hour', 'huge', 'hull', 'hump', 'hunt',
  'icon', 'idea', 'iris', 'iron', 'isle', 'item', 'jade', 'jail',
  'jazz', 'jeep', 'jump', 'junk', 'kept', 'kind', 'king', 'kite',
  'knee', 'knot', 'lace', 'lake', 'lamp', 'land', 'lane', 'lark',
  'last', 'late', 'lawn', 'leaf', 'leap', 'lens', 'lime', 'line',
  'link', 'lion', 'list', 'load', 'loaf', 'loan', 'lock', 'loft',
];
