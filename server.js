#!/usr/bin/env node
const http = require('http');
const config = require('./config');
const openai = require(config.openaiClientPath);
const { generateBatchQuotes } = require('./lib/quotes');
const locales = {
  ja: require('./locales/ja'),
  en: require('./locales/en'),
  zh: require('./locales/zh'),
  ko: require('./locales/ko'),
  fr: require('./locales/fr'),
  es: require('./locales/es'),
  de: require('./locales/de')
};
const allPatterns = Object.fromEntries(Object.entries(locales).map(([k,v])=>[k,v.patterns]));
const locale = locales[config.language];

function createBatchPrompt(count){
  return locale.createBatchPrompt(config.combinedTones.join('+'), count, config.category);
}

http.createServer(async (req,res)=>{
  if(req.url.startsWith('/quote')){
    const quotes = await generateBatchQuotes(openai, config.model, locale.system, createBatchPrompt, allPatterns, config.language, config.combinedTones.join('+'), 'legendaly.log','echo.tmp',1,false,config.userPrompt,config.category);
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ quote: quotes[0] }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(process.env.PORT || 3000, ()=>{
  console.log('Legendaly API server running');
});
