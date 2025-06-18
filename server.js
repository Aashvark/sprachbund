const path = require("path");
const handlebars = require("handlebars");
const fastify = require("fastify")({ logger: false });

const seo = require("./src/json/seo.json");

const lessons = require("./src/json/lessons.json");
const dictionary = require("./src/json/dictionary.json");
const { console } = require("inspector");

let language = "nórem";
let dict     = dictionary[language];
let grammar  = dictionary[`${language}-grammar`]; 

fastify.register(require("@fastify/static"), { root: path.join(__dirname, "public"), prefix: "/" });
fastify.register(require("@fastify/view"), { engine: { handlebars: handlebars } });
fastify.register(require("@fastify/formbody"));

handlebars.registerHelper('add', function(a, b) { return a + b; });
handlebars.registerHelper('ifEquals', function(arg1, arg2, options) { return (arg1 === arg2) ? options.fn(this) : options.inverse(this); });
handlebars.registerHelper('ternaryEq', function(arg1, arg2, op1, op2) { return (arg1 === arg2) ? op1 : op2; });
handlebars.registerHelper('json', function(a) { return JSON.stringify(a); });
handlebars.registerHelper('get-attribute', function(word, attribute) { return dict[word.trimEnd()][attribute]; });
handlebars.registerHelper('tip-format', function(arg) { return new handlebars.SafeString(replaceClass(arg, "merienda accent")); });

handlebars.registerHelper('hover-translate', function(prompt, lang) {
  let tokens = [];
  for (var word of prompt.split(" ")) {
    let section = "";
    for (var letter of word) section += (/[.,\/#!$%\^&\*;:{}=\-`~()]/g.test(letter) ? " " : "") + letter;
    tokens.push(section.split(" "));
  }
  return lang === "native" ? hoverNative(tokens) : hoverForeign(tokens);
});

function hoverNative(tokens) {
  let string = "";
  let stored = "";

  for (var index in tokens) {
    let token = tokens[index];
    let next = parseInt(index) + 1;
    stored += token[0];

    if ((index < tokens.length - 1 && isInDictionary(stored + " " + tokens[next][0]) || index < tokens.length - 2 && isInDictionary(stored + " " + tokens[next][0] + " " + tokens[parseInt(next) + 1][0])) && token.length === 1) stored += " ";
    else {
      let submeaning;
      if (stored.includes(" ")) { submeaning = stored.split(" ").map((v) => { return Object.keys(dict).filter(key => dict[key].hint.includes(v)); }); }
      let keys = Object.keys(dict).filter(key => getInComplex(key, stored.toLowerCase()));
      string += formHints(token.length > 1 ? [stored, token[1]] : [stored], keys.length > 0 ? keys : undefined, submeaning);
      stored = "";
    }
  }
  return new handlebars.SafeString(string);
}

function hoverForeign(tokens) {
  let string = "";
  let stored = "";

  for (var index in tokens) {
    let token = tokens[index];
    let next = parseInt(index) + 1;
    stored += token[0];

    if (stored === "___") {
      string += `<div class="hint"><p class="blank"></p></div>`;
      stored = "";
    }
    else if (index < tokens.length - 1 && ((stored + " " + tokens[next][0]) in dict || matchCluster(stored + " " + tokens[next][0])) && token.length === 1) stored += " ";
    else {
      let generated = generateKeys(stored);
      string += formHints(token.length > 1 ? [stored, token[1]] : [stored], generated[0], generated[1]);
      stored = "";
    }
  }
  return new handlebars.SafeString(string);
}

function matchCluster(phrase) {
  let words = phrase.toLowerCase().split(" ").map((word) => [word, dict[word]]);
  for (let template of Object.keys(grammar["templates"])) {
    if (words.length === template.split(" ").length && !template.split(" ").map((word, index) => word.at(0) != "[" && word === words[index][0] || word.at(0) === "[" && word.substring(1, word.length - 1) === words[index][1].pos).includes(false)) return grammar["templates"][template];
  }
  return undefined; 
}

function generateKeys(phrase) {
  let match = matchCluster(phrase);
  let submeaning;
  if (phrase.includes(" ")) submeaning = phrase.split(" ").map((key) => key in dict ? dict[key].hint : []);
  if (match) {
    let words = phrase.toLowerCase().split(" ").map((word) => dict[word]);
    let hints = [];
    match.hint.forEach((template) => {
      if (!template.includes("[")) hints.push(template);
      let chosen = [];
      for (let word of template.split(" ")) {
        let pos = words.map((w) => w.pos);
        if (word[0] === "[" && pos.includes(word.substring(1, word.length - 1))) chosen.push(words[pos.indexOf(word.substring(1, word.length - 1))]);
      }
      for (let chose of chosen) {
        for (let l of chose.simple) hints.push(template.replace(`[${chose.pos}]`, l));
      }
    });
    return [hints, submeaning];
  }
  return [dict[phrase].hint, submeaning];
}

function formHints(word, keys, submeaning) {
  let construction = "";
  
  if (keys === undefined) construction = `<div class="hint">${word.slice(0, word.length - 1).join(" ") + word[word.length - 1]}</div>`;
  else {
    construction = `<div class="hint"><span>${word[0]}</span>${word.length > 1 ? word[1] : ""}<table><tbody>`;
    for (var key of keys) { construction += `<tr class="row"><td colspan="${submeaning != undefined && submeaning.length > 0 ? submeaning.length : 1}">${key}</td></tr>`; }
    if (submeaning != undefined) {
       for (let i = 0; i < getLongestList(submeaning).length; i++) {
         construction += `<tr>`;
         for (var sub of submeaning) { construction += `<td>${sub.length > i ? sub[i] : ""}</td>`; } 
         construction += `</tr>`;
       }
     }
    construction += `</tbody></table></div>`;
  }
  return construction; 
}

function replaceClass(text, class_) { return text.replaceAll("[", `<span class=\"${class_}\">`).replaceAll("]", "</span>"); }

function isInDictionary(match) { return Object.keys(dict).filter(key => dict[key].match.includes(match.toLowerCase())).length !== 0; }
function getInComplex(key, match) { return dict[key].match.includes(match); }

function getLongestList(nestedList) {
  let largest = [];
  nestedList.forEach(element => { if (element.length > largest.length) largest = element; });
  return largest;
}

fastify.get("/", function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index, units: lessons }); });
fastify.get("/learn", function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index, units: lessons }); });
fastify.get("/lesson", function (request, reply) { return reply.redirect('/learn'); });
fastify.post("/lesson", function (request, reply) { return reply.view('/src/lesson.hbs', {seo: seo, unitno: request.body.unit, lessons: lessons[request.body.unit].unit[request.body[request.body.unit + "-lesson"]]});});

fastify.setNotFoundHandler(function(request, reply) { return reply.view("/src/error.hbs", { seo: seo.index, error: request.routeOptions.url }); });

fastify.listen({ port: process.env.PORT || 4000, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Sprachbund is listening on ${address}`);
  }
);
