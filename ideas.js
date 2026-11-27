/* Image ideas "in words" for Memory Castle (v0.4). Local only: no server, no AI.
   Abstract and Scripture words are mapped to concrete pictures (a built-in word list that holds single words only,
   never Bible text). Each idea has action, exaggeration, senses and a direct interaction with the stop's place.
   The learner picks one, edits it, or ignores it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Ideas = factory();
})(this, function () {
  'use strict';
  var STOP = {};
  ('a an the and or but of to in on at for with by from as is are was were be been being am it its this that these those who whom whose which what when where he she they them his her their you your we our us i me my not no nor so if then than there shall will would should can could may might must do does did have has had into upon unto very all any each every some shown those happy blessed also just like said says say how theirs yours ours remember').split(' ').forEach(function (w) { STOP[w] = 1; });

  /* Word list. 'stem,stem|picture|picture'. A stem of 5+ letters matches any word starting with it;
     a shorter stem matches only that word (or with an s). A leading * on a picture means it is plural
     ("*chains"); a leading ! means treat it gently (sacred subjects get calm pictures, never comic ones). */
  var WORDS = [
    'understand,insight|a giant glowing lightbulb|a wise owl in thick round glasses',
    'wisdom,wise|a huge old book with glowing pages|a wise old tortoise in spectacles',
    'knowledge,learn|a tower of books reaching the ceiling|a giant magnifying glass',
    'truth,true|a giant magnifying glass|a spotless mirror',
    'mercy,merci,merciful|a hand wrapped in a huge bandage|a nurse with an enormous first-aid kit',
    'compassion,pity|a giant teddy bear with open arms|a hot-water bottle with a kind face',
    'comfort,consol|a warm woolly blanket|a squashy armchair piled with cushions',
    'kind,kindness|a steaming cup of tea|a basket of fresh warm scones',
    'gentle,gentleness|a fluffy kitten|a single feather floating down',
    'meek,meekness|a small woolly lamb|a small grey donkey',
    'humble,humility|a tiny mouse taking a deep bow|a plain wooden stool',
    'pride,proud|a puffed-up peacock|a hot-air balloon with a swollen head',
    'poor,poverty|*empty pockets turned inside out|a rattling empty tin cup',
    'rich,wealth,riches|a barrel overflowing with gold coins|a mountain of shiny coins',
    'money,mammon|a bag of jangling coins|a piggy bank the size of a car',
    'spirit|a friendly glowing ghost|a flickering candle flame',
    'soul|a small glowing lantern|a fluttering white butterfly',
    'heart|a big red heart thumping like a drum|a big red heart with a loud alarm clock inside',
    'kingdom,king,royal|a golden crown on a velvet cushion|a tall castle tower flying flags',
    'heaven,paradise|a fluffy cloud with golden gates|a ladder reaching up into the clouds',
    'earth,world|a giant spinning globe|a mound of rich dark soil',
    'inherit,herit,legacy|a heavy treasure chest with a bow on top|a giant scroll sealed with red wax',
    'mourn,mourning,grief,sorrow,sad,weep|a bucket filling with tears|a weeping willow with dripping branches',
    'tears|a bucket filling with tears|a leaky tap dripping salty water',
    'cry,sobbing|a dripping rain cloud over one tiny person|a bucket filling with tears',
    'pain,suffer,suffering|a throbbing red thumb the size of a pumpkin|a dark storm cloud raining on one small person',
    'hunger,hungry,starv|a rumbling tummy with a face|a table piled with hot pies',
    'thirst,thirsty|a giant jug of icy water|a dry, cracked riverbed',
    'righteous,justice,just,right,fair|a set of golden scales|a giant wooden gavel',
    'judge,judgement|a giant wooden gavel|a set of golden scales',
    'satisf,filled,fill,plenty,abundance|a bowl of hot stew piled so high it spills|a bulging picnic basket',
    'pure,purity,clean|a drift of fresh white snow|a glass of crystal-clear water',
    'holy,holiness|!a gentle flame hovering in the air|!a soft golden light',
    'peace,peaceful,peacemaker,peacemakers,reconcile|a white dove carrying an olive branch|*two clasped hands wrapped in an olive branch',
    'persecut|*heavy iron chains|a rattling ball and chain',
    'prison,prisoner,captive,captivity|a huge locked jail door|*rattling iron bars',
    'free,freedom,liberty|an open birdcage with the door flung wide|a bird soaring out of a cage',
    'joy,rejoice,glad,gladness|*a hundred bouncing yellow balloons|a trumpet blasting a happy tune',
    'laugh,laughter|a giggling hyena|a belly laugh that shakes a jelly',
    'praise,glory,glorify|a booming brass band|a blazing golden sunburst',
    'sing,song,psalm|a choir of frogs in bow ties|a huge old jukebox',
    'prayer,pray,praying|!*a pair of folded hands glowing softly|!a candle with a steady flame',
    'worship,adore|!*a pair of folded hands glowing softly|!a candle with a steady flame',
    'god|!a shaft of golden light breaking through the clouds|!a blaze of golden light',
    'lord,almighty|!a shaft of golden light breaking through the clouds|!a blaze of golden light',
    'father|!a shaft of golden light breaking through the clouds|!a warm lamp in a window',
    'jesus,christ,messiah|!a shining shepherd\u2019s staff|!a warm golden light',
    'cross|!a tall wooden cross|!a wooden cross in a golden light',
    'resurrect,risen,rise|!a great stone rolling away from a cave|!a golden sunrise',
    'angel,angels|!an angel with enormous feathery wings|!a bright winged messenger',
    'saviour,savior,salvation,save,redeem,redemption,rescue|a lifebuoy|a rope ladder thrown down to someone',
    'grace,gift,gifts|a gift box tied with an enormous ribbon|a parcel dropping from the sky',
    'faith,believe,belief|a rope bridge over a deep gorge|a single mustard seed as big as a boulder',
    'hope|a sunrise bursting over the horizon|a ship\u2019s anchor',
    'trust|*two strong hands catching someone who falls|a sturdy rope bridge',
    'love,loved,loving,beloved|a bunch of red roses|a giant hug-shaped heart',
    'forgive,forgiving,forgiveness,pardon|a rubber eraser as big as a pillow|a bin full of torn-up IOU slips',
    'sin,sins,sinner,sinners,iniquity,transgress,wrongdoing,evil|a giant ink blot|a muddy puddle',
    'repent,repentance|a U-turn road sign|a huge steering wheel spinning round',
    'patience,patient,endure,endurance|a snail wearing a wristwatch|a very slow queue of tortoises',
    'courage,brave,bravery|a lion in a shiny knight\u2019s helmet|a small mouse in a big helmet',
    'strength,strong,mighty,power|a huge ox pulling a plough|a weightlifter bending a steel bar',
    'weak,weakness,frail|a wilted flower|a wobbly jelly',
    'fear,afraid,terror,frightened|*wind-up chattering teeth|a shivering jelly',
    'anger,angry,wrath,rage|a red kettle screaming with steam|a volcano with a grumpy face',
    'worry,anxious,anxiety|a hamster running in a wheel|a tangled ball of string',
    'trouble,troubled,distress|a tangled ball of string|a storm cloud following one person',
    'burden,burdens,weary,heavy|a backpack stuffed with bricks|a wheelbarrow stuck in mud',
    'rest,sabbath|a hammock swinging between two trees|a snoring bear in pyjamas',
    'sleep,slumber|a snoring bear in pyjamas|a huge soft pillow',
    'generous,generosity,give,giving|an open purse spilling coins|a huge bag of presents',
    'reward,prize|a shiny trophy as big as a door|a gold medal on a ribbon',
    'victory,triumph,conquer|a trophy held high|a flag planted on a mountain top',
    'law,commandment,commandments,decree|*two stone tablets|a giant rule book',
    'covenant,promise,oath|a scroll tied with a rainbow ribbon|a golden envelope with a wax seal',
    'light,lamp,lantern|a blazing spotlight|a huge lantern swinging',
    'darkness,dark,night|a pitch-black cave|a thick black cloak',
    'salt|a giant salt shaker|a mountain of white salt',
    'city|a tiny glowing city on a hill|a tall tower of lit-up windows',
    'hill,mountain,mount|a huge mountain with a flag on top|a hill with a staircase carved into it',
    'shepherd|a shepherd\u2019s crook|a shepherd carrying a lamb on his shoulders',
    'sheep,flock,lamb|a woolly sheep|a flock of fluffy sheep',
    'wolf,wolves|a wolf in a woolly sheep suit|a snarling wolf in a pink hat',
    'vine,vineyard,grapes|a huge bunch of grapes|a vine heavy with purple grapes',
    'wine|a goblet of red wine|a barrel rolling along',
    'bread,loaf|a warm loaf of bread|a basket of crusty rolls',
    'water,river,stream|a gushing fountain|a rushing river',
    'fish,fisherman,fishermen|a giant silver fish|a heavy fishing net full of wriggling fish',
    'net,nets|a heavy fishing net|a fishing net full of wriggling fish',
    'boat,ship|a rowing boat|a ship tossing on huge waves',
    'sea,waves|a rolling wave|a tall splashing wave',
    'storm,tempest|a thunderstorm cloud with a grumpy face|a howling gale',
    'rock,stone,stones|a huge boulder|a boulder rolling downhill',
    'house,home,build,builder|a wobbly house built on sand|a house made of playing cards',
    'sand|a huge sandcastle|a heap of golden sand',
    'seed,seeds,sower|a single seed as big as a boulder|a farmer scattering seeds from a bucket',
    'harvest,reap|a wheelbarrow of golden wheat|a combine harvester',
    'wheat,corn,grain|a field of golden wheat|a sack of golden wheat',
    'fruit,fruits|a tree dripping with fruit|a basket of shiny fruit',
    'tree,branch,branches|a giant leafy tree|a tree with a swing',
    'treasure,treasures|a heavy treasure chest|a pile of gold and jewels',
    'pearl,pearls|a pearl as big as a football|a giant oyster',
    'thief,thieves,robber,steal,stealing|a robber in a stripy jumper with a swag bag|a sneaking cat burglar',
    'moth,moths|a fluffy moth with a big appetite|a flapping moth wearing a bib',
    'rust,decay|a rusty old bucket|a rusty gate that squeaks',
    'bird,birds,sparrow,sparrows,raven,ravens|a loud noisy sparrow|a flock of chirping birds',
    'lily,lilies,flower,flowers|a giant white lily|a bunch of white lilies',
    'enemy,enemies,foe|a grumpy scarecrow|a growling guard dog',
    'neighbour,neighbor,neighbours|a friendly person leaning over a fence|a neighbour with a plate of biscuits',
    'stranger,strangers,foreigner|a stranger with a big suitcase|a traveller with a map',
    'door,gate,gates|a huge wooden door|a narrow iron gate',
    'narrow,path,way,road|a narrow winding path|a long road stretching away',
    'knock,knocking|a giant brass door knocker|a giant fist knocking',
    'fire,flame,flames,burn|a roaring bonfire|a leaping flame',
    'thorn,thorns|a giant thorny rose bush|*sharp thorns',
    'wedding,marriage,bride,bridegroom|a towering wedding cake|a bride with a very long veil',
    'servant,servants,slave,serve|a butler carrying a silver tray|a waiter juggling plates',
    'talent,talents|a bag of gold coins|a spotlight on a stage',
    'blind,blindness|a pair of dark glasses|a person feeling their way with a long white cane',
    'heal,healing,healed,cure|a giant sticking plaster|a nurse with a magic wand',
    'life,live,living|a sprouting green seedling|a beating heart on a monitor',
    'eternal,eternity,forever,everlasting|an endless winding staircase|a clock with no hands',
    'death,die,dead,died|a cold dark tomb|a tall grey tombstone',
    'create,creation,creator|a giant paintbrush painting the sky|a potter\u2019s wheel spinning',
    'flesh,body|a giant muscly arm|a statue of a person',
    'blood|a red ribbon fluttering|a red river flowing',
    'child,children,little|*a gaggle of giggling children|a toddler on a tricycle',
    'bless,blessing,blessings|a shower of golden sparkles|a basket overflowing with gifts',
    'curse,cursed|a black cloud with a grumpy face|a witch\u2019s cauldron bubbling over',
    'war,battle,fight,sword|a clanging suit of armour|a giant sword stuck in the ground',
    'prophet,prophets,prophecy|a booming megaphone|a long scroll unrolling',
    'teacher,teach,teaching,disciple,disciples|a teacher with a pointer and a blackboard|*rows of students writing in notebooks',
    'temple,church|a tall church with a bell ringing|a giant bell',
    'bell,bells|a giant bell|*a ringing peal of bells',
    'bridge|a rope bridge over a gorge|a stone bridge arching over a river',
    'journey,pilgrim,pilgrimage|a backpack with a walking stick|a pair of muddy boots'
  ];

  var ENTRIES = WORDS.map(function (line) {
    var p = line.split('|'), pics = p.slice(1).map(function (s) {
      var gentle = false, plural = false;
      while (s.charAt(0) === '!' || s.charAt(0) === '*') { if (s.charAt(0) === '!') gentle = true; else plural = true; s = s.slice(1); }
      return { t: s, pl: plural, gentle: gentle };
    });
    return { stems: p[0].split(','), pics: pics };
  });

  function matches(stem, w) {
    if (stem.length >= 5) return w.indexOf(stem) === 0;
    return w === stem || w === stem + 's';
  }
  function lookup(w) {
    for (var i = 0; i < ENTRIES.length; i++) for (var j = 0; j < ENTRIES[i].stems.length; j++) if (matches(ENTRIES[i].stems[j], w)) return ENTRIES[i];
    return null;
  }
  function tokens(text) {
    return String(text || '').split(/\s+/).map(function (raw) { return raw.toLowerCase().replace(/^[^a-z0-9\u00c0-\u024f]+|[^a-z0-9\u00c0-\u024f]+$/g, '').replace(/\u2019s$|'s$/, ''); }).filter(Boolean);
  }
  /* up to 3 different pictured subjects found in the text, in the order they appear */
  function hits(text) {
    var out = [], seen = [];
    tokens(text).forEach(function (w) {
      if (out.length >= 3 || STOP[w] || w.length < 3) return;
      var e = lookup(w); if (e && seen.indexOf(e) < 0) { seen.push(e); out.push({ word: w, entry: e }); }
    });
    return out;
  }

  function keywords(text, max) {
    max = max || 2;
    var seen = {}, list = [];
    String(text || '').split(/\s+/).forEach(function (raw, i) {
      var w = raw.toLowerCase().replace(/^[^a-z0-9\u00c0-\u024f]+|[^a-z0-9\u00c0-\u024f]+$/g, '').replace(/\u2019s$|'s$/, '');
      if (w.length < 4 || STOP[w] || /^\d+$/.test(w)) return;
      var stem = w.slice(0, 4); if (seen[stem]) return; seen[stem] = 1;
      list.push({ w: w, i: i, score: w.length });
    });
    return list.slice().sort(function (a, b) { return b.score - a.score || a.i - b.i; }).slice(0, max).sort(function (a, b) { return a.i - b.i; }).map(function (x) { return x.w; });
  }

  function place(stop) {
    var s = String(stop || '').trim().replace(/\s+/g, ' ');
    if (!s) return 'this stop';
    s = s.charAt(0).toLowerCase() + s.slice(1);
    return /^(the|a|an|my|your|our|his|her|their|this|that|some)\b/.test(s) ? s : 'the ' + s;
  }

  /* ---- sentence parts. O = the picture (a noun phrase), P = the place, pl = O is plural ---- */
  var LEAD = ['Picture', 'Imagine', 'See'];
  var ACT = [
    function (P) { return 'crashing through ' + P + ' with a deafening bang'; },
    function (P) { return 'sliding all the way down ' + P; },
    function (P) { return 'wrapped around ' + P + ' like a giant hug'; },
    function (P) { return 'squeezing through ' + P + ' with a loud squeak'; },
    function (P) { return 'sitting on top of ' + P + ' and refusing to move'; },
    function (P) { return 'spinning in circles in front of ' + P; },
    function (P) { return 'bolted onto ' + P + ' and wobbling wildly'; },
    function (P) { return 'pouring over ' + P + ' like a waterfall'; },
    function (P) { return 'bouncing off ' + P + ' again and again'; },
    function (P) { return 'climbing all over ' + P; },
    function (P) { return 'bursting out of ' + P + ' in a cloud of dust'; }
  ];
  var GENTLE_ACT = [
    function (P) { return 'glowing softly over ' + P; },
    function (P) { return 'shining down on ' + P; },
    function (P) { return 'resting quietly in front of ' + P; },
    function (P) { return 'rising slowly above ' + P; }
  ];
  function pro(pl) { return { it: pl ? 'They' : 'It', it2: pl ? 'they' : 'it', them: pl ? 'them' : 'it', v: function (s, p) { return pl ? p : s; } }; }
  var BIG = [
    function (P, x) { return x.it + ' ' + x.v('is', 'are') + ' as big as a bus.'; },
    function (P, x) { return x.it + ' ' + x.v('is', 'are') + ' twice as tall as you.'; },
    function (P, x) { return x.it + ' ' + x.v('is', 'are') + ' far too big for ' + P + '.'; },
    function (P, x) { return x.it + ' ' + x.v('leaves', 'leave') + ' a huge mess all over ' + P + '.'; },
    function (P, x) { return x.it + ' ' + x.v('is', 'are') + ' shouting so loudly that ' + P + ' shakes.'; },
    function (P, x) { return x.it + ' ' + x.v('is', 'are') + ' glowing bright orange and impossible to miss.'; }
  ];
  var GENTLE_BIG = [
    function () { return 'The whole place goes quiet and still.'; },
    function () { return 'Everything is warm and bright, and nothing is rushed.'; },
    function () { return 'A deep calm settles over the whole place.'; }
  ];
  var SMELL = ['hot buttered toast', 'wet dog', 'fresh paint', 'burnt popcorn', 'strong coffee', 'frying onions', 'cut grass', 'lemon cleaner'];
  var SOUND = ['a brass band', 'a roaring crowd', 'a squeaking trumpet', 'thunder rolling', 'a school bell', 'a choir of cats', 'fireworks popping', 'a very loud drum'];
  var TOUCH = ['ice-cold drips on your neck', 'warm sticky syrup on your hands', 'a rough scratchy rug under your feet', 'a strong wind pushing your hair', 'sticky glue on your fingers', 'slippery mud between your toes'];
  var TASTE = ['salt on your lips', 'sour lemon', 'sweet honey', 'chalky dust', 'sticky toffee', 'cold metal'];
  var SENSE = [
    function (h) { return 'You can smell ' + SMELL[h % SMELL.length] + ' and hear ' + SOUND[(h + 3) % SOUND.length] + '.'; },
    function (h) { return 'You can feel ' + TOUCH[h % TOUCH.length] + ' and taste ' + TASTE[(h + 2) % TASTE.length] + '.'; },
    function (h) { return 'You can hear ' + SOUND[h % SOUND.length] + ' and smell ' + SMELL[(h + 5) % SMELL.length] + '.'; }
  ];
  var GENTLE_SENSE = [
    function () { return 'You can hear a soft hush and feel a gentle warmth on your face.'; },
    function () { return 'You can smell fresh, clean air and hear your own slow breathing.'; }
  ];
  var YOU = [
    function (x) { return 'You wave at ' + x.them + ', and ' + x.it2 + ' ' + x.v('waves', 'wave') + ' back.'; },
    function (x) { return 'You grab ' + x.them + ' with both hands, and ' + x.it2 + ' ' + x.v('shakes', 'shake') + ' you all around the room.'; },
    function (x) { return 'You try to walk past, but ' + x.it2 + ' ' + x.v('blocks', 'block') + ' your way and ' + x.v('tickles', 'tickle') + ' you until you laugh.'; },
    function (x) { return 'You run, and ' + x.it2 + ' ' + x.v('chases', 'chase') + ' you in a circle.'; }
  ];

  function idea(pic, word, P, n, h) {
    var x = pro(pic.pl), O = pic.t, lead = LEAD[(h + n) % LEAD.length], isare = x.v('is', 'are');
    if (pic.gentle) {
      return lead + ' ' + O + '. ' + x.it + ' ' + isare + ' ' + GENTLE_ACT[(h + n) % GENTLE_ACT.length](P) + '. ' + GENTLE_BIG[(h + n) % GENTLE_BIG.length]() + ' ' + GENTLE_SENSE[(h + n) % GENTLE_SENSE.length]();
    }
    return lead + ' ' + O + '. ' + x.it + ' ' + isare + ' ' + ACT[(h + n * 5) % ACT.length](P) + '. ' + BIG[(h + n * 2 + 1) % BIG.length](P, x) + ' ' +
      (n % 2 === 0 ? SENSE[(h + n) % SENSE.length](h + n) : YOU[(h + n) % YOU.length](x));
  }

  /* up to six different ideas for one stop; seed changes which comes first */
  function ideas(stop, text, seed) {
    var P = place(stop), found = hits(text), seedN = seed || 0, pool = [], out = [], seen = {}, h = 0, i, r, w;
    for (w = 0; w < 2; w++) found.forEach(function (f) { if (f.entry.pics[w]) pool.push({ pic: f.entry.pics[w], word: f.word }); });
    if (!pool.length) {
      var kw = keywords(text, 2);
      kw.forEach(function (k) { pool.push({ pic: { t: 'a giant neon sign flashing the word \u201c' + k + '\u201d', pl: false, gentle: false }, word: k }); });
      if (!pool.length) pool.push({ pic: { t: 'a giant, strange-looking object wrapped in shiny paper', pl: false, gentle: false }, word: '' });
    }
    var base = String(text || '') + '|' + String(stop || ''); for (i = 0; i < base.length; i++) h += base.charCodeAt(i);
    for (r = 0; r < 40 && out.length < 6; r++) {
      var p = pool[(r + seedN) % pool.length], s = idea(p.pic, p.word, P, r + seedN * 7, h);
      if (!seen[s]) { seen[s] = 1; out.push(s); }
    }
    return out;
  }

  return { ideas: ideas, keywords: keywords, place: place, hits: hits, size: ENTRIES.length };
});
