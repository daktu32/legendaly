const assert = require('assert').strict;
const parseQuotes = require('../parseQuotes');

const ja = `名言 : 天は二物を与えず\nキャラクター名 : 武田 信玄\n作品名 : 風林火山\n西暦 : 1570`;
const en = `Quote : To be or not to be\nCharacter Name : Hamlet\nWork Title : Hamlet\nYear : 1603`;
const zh = `名言 : 知足者常乐\n角色名 : 李白\n作品名 : 大唐诗魂\n年代 : 742`;
const ko = `명언 : 인생은 미완성\n캐릭터 이름 : 홍길동\n작품명 : 홍길동전\n연도 : 1612`;
const fr = `Citation : L'avenir appartient à ceux qui se lèvent tôt\nNom du Personnage : Jean Valjean\nTitre de l'Œuvre : Les Misérables\nAnnée : 1862`;
const es = `Cita : La vida es sueño\nNombre del Personaje : Segismundo\nTítulo de la Obra : La vida es sueño\nAño : 1635`;
const de = `Zitat : Einigkeit und Recht und Freiheit\nCharaktername : Max Mustermann\nWerktitel : Deutsches Lied\nJahr : 1841`;

const output = [ja, en, zh, ko, fr, es, de].join('\n---\n');

const expected = [
  {quote:'天は二物を与えず', user:'武田 信玄', source:'風林火山', date:'1570'},
  {quote:'To be or not to be', user:'Hamlet', source:'Hamlet', date:'1603'},
  {quote:'知足者常乐', user:'李白', source:'大唐诗魂', date:'742'},
  {quote:'인생은 미완성', user:'홍길동', source:'홍길동전', date:'1612'},
  {quote:"L'avenir appartient à ceux qui se lèvent tôt", user:'Jean Valjean', source:'Les Misérables', date:'1862'},
  {quote:'La vida es sueño', user:'Segismundo', source:'La vida es sueño', date:'1635'},
  {quote:'Einigkeit und Recht und Freiheit', user:'Max Mustermann', source:'Deutsches Lied', date:'1841'}
];

const result = parseQuotes(output, 'ja'); // language passed is used first but parser falls back automatically
assert.deepStrictEqual(result, expected);

console.log('All parse tests passed');
