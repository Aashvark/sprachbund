const path = require("path");
const handlebars = require("handlebars");
const fastify = require("fastify")({ logger: false });

const seo = require("./src/json/seo.json");
const dictionary = require("./src/json/dictionary.json");
const lessons = require("./src/json/lessons.json");

let language = "nóri";
let dict     = dictionary[language];
let grammar  = dictionary[`${language}-grammar`]; 

fastify.register(require("@fastify/static"), { root: path.join(__dirname, "public"), prefix: "/" });
fastify.register(require("@fastify/view"), { engine: { handlebars: handlebars } });
fastify.register(require("@fastify/formbody"));

handlebars.registerHelper('ifEquals',  function (a, b, options)  { return a === b ? options.fn(this) : options.inverse(this); });
handlebars.registerHelper('ternaryEq', function (a, b, op1, op2) { return a === b ? op1 : op2; });

handlebars.registerHelper('add',       function (a, b) { return a + b; });
handlebars.registerHelper('json',      function (a)    { return escape(JSON.stringify(a)); });

handlebars.registerHelper('get-attribute', function (word, attribute) { return dict[word.trimEnd()][attribute]; });
handlebars.registerHelper('tip-format',    function (arg)             { return new handlebars.SafeString(replaceClass(arg, "merienda accent")); });

handlebars.registerHelper('hover-translate', function(prompt, lang) {
  let tokens = [];
  for (var word of prompt.split(" ")) {
    let section = "";
    for (var letter of word) section += (/[.,\/#!$%\^&\*;\?:{}=\-`~()]/g.test(letter) ? " " : "") + letter;
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

    if ((index < tokens.length - 1 && matchSelector(stored + " " + tokens[next][0]) || index < tokens.length - 2 && matchSelector(stored + " " + tokens[next][0] + " " + tokens[next + 1][0]) || index < tokens.length - 3 && matchSelector(stored + " " + tokens[next][0] + " " + tokens[next + 1][0] + " " + tokens[next + 2][0])) && token.length === 1) stored += " ";
    else {
      let generated = generateN(stored.toLowerCase());
      string += formHints(token.length > 1 ? [stored, token[1]] : [stored], generated[0], generated[1]);
      stored = "";
    }
  }
  return new handlebars.SafeString(string);
}

function isInDictionary(match) { return Object.keys(dict).filter(key => "match" in dict[key] && dict[key].match.includes(match.toLowerCase())).length !== 0; }
function findmatchingsimple(match) {
    let val = Object.keys(dict).filter(key => "simple" in dict[key] && dict[key].simple.includes(match))[0];
    return [val, dict[val]];
}

function matchSelector(phrase) {
  if (isInDictionary(phrase.toLowerCase())) { return Object.keys(dict).filter(key => "match" in dict[key] && dict[key].match.includes(phrase)); }
  let words = phrase.toLowerCase().split(" ");

  for (template of Object.keys(grammar["templates"])) {
    for (let temp of grammar["templates"][template].match) {
      if (words.length === temp.split(" ").length && temp.toLowerCase().split(" ").filter((word, index) => {
        if (word.at(0) != "[" && word === words[index]) return true;
        else if (word.at(0) === "[") {
          let find = findmatchingsimple(words[index].substring(0, words[index].length - (word[word.length - 1] === "s" ? 1 : 0)));
          if (find[0] === undefined) return false;
          return word.substring(1, word.indexOf("]")) === find[1].pos; 
        }
      }).length === temp.split(" ").length) return [template, temp];
    }
  }
  return undefined; 
}

function generateN(phrase) {
  let match = matchSelector(phrase);
  let submeaning;
  if (phrase.includes(" ")) submeaning = phrase.split(" ").map(v => Object.keys(dict).filter(key => 'simple' in dict[key] && dict[key].simple.includes(v)));
  if (submeaning != undefined && (submeaning.length === 0 || submeaning.every(i => i.length === 0))) submeaning = undefined;
  if (!isInDictionary(phrase) && match) {
    let slots = phrase.toLowerCase().split(" ").map((word, index) => {
        if (match[1].split(" ")[index].at(0) != "[") return false;
        let section = match[1].split(" ")[index];
        return word.substring(0, word.length - (section[section.length - 1] === "s" ? 1 : 0));
    }).filter(word => word);
    let hint = match[0];
    for (let slot of slots) {
        let matching = findmatchingsimple(slot);
        hint = hint.replace('[' + matching[1].pos + ']', matching[0]);
    }
    return [[hint], submeaning];
  }
  let ret = isInDictionary(phrase) ? Object.keys(dict).filter(key => "match" in dict[key] && dict[key].match.includes(phrase)) : undefined;
  return [ret, ret != undefined && ret.length === 1 ? undefined : submeaning];
}

function hoverForeign(tokens) {
  let string = "";
  let stored = "";

  for (var index in tokens) {
    let token = tokens[index];
    let next = parseInt(index) + 1;
    stored += token[0];

    if (stored === "___") {
      string += `<div class="hint"><span class="blank"></span></div>`;
      stored = "";
    }
    else if ((index < tokens.length - 1 && matchCluster(stored + " " + tokens[next][0]) || index < tokens.length - 2 && matchCluster(stored + " " + tokens[next][0] + " " + tokens[next + 1][0])) && token.length === 1) stored += " ";
    else {
      let generated = generateKeys(stored.toLowerCase());
      string += formHints(token.length === 1 ? [stored] : [stored, token[1]], generated[0], generated[1]);
      stored = "";
    }
  }
  return new handlebars.SafeString(string);
}

function matchCluster(phrase) {
  if (phrase.toLowerCase() in dict && "hint" in dict[phrase.toLowerCase()]) return dict[phrase.toLowerCase()];
  let words = phrase.toLowerCase().split(" ").map(word => word in dict ? [word, dict[word]] : undefined);
  if (words.includes(undefined)) return undefined;
  for (template of Object.keys(grammar["templates"])) {
    if (words.length === template.split(" ").length && !template.split(" ").map((word, index) => word.at(0) != "[" && word === words[index][0] || word.at(0) === "[" && word.substring(1, word.length - 1) === words[index][1].pos).includes(false)) return [template, grammar["templates"][template]];
  }
  return undefined; 
}

function generateKeys(phrase) {
  let match = matchCluster(phrase);
  let submeaning;
  if (phrase.includes(" ")) submeaning = phrase.split(" ").map((key) => key in dict && "hint" in dict[key] ? dict[key].hint : generateKeys(key)[0]);
  if (!(phrase in dict && "hint" in dict[phrase]) && match) {
    let slots = phrase.toLowerCase().split(" ").map((word, index) => {
      if (match[0].split(" ")[index] === undefined || match[0].split(" ")[index].at(0) != "[") return false;
      return dict[word];
    }).filter(word => word);
    let hints = [];
    for (let m of match[1].hint) {
      let hint = [m];
      for (let slot of slots) {
        let n = hint;
        for (let i = 0; i < slot.simple.length; i++) { 
          let l = n.map(h => h.replace('[' + slot.pos + ']', slot.simple[i]));
          hint = i === 0 ? l : hint.concat(l);
        }
      }
      hints = hints.concat(hint);
    }
    return [hints, submeaning];
  }
  return [phrase in dict && "hint" in dict[phrase] ? dict[phrase].hint : undefined, submeaning];
}

function formHints(word, keys, submeaning) {
  let construction = "";
  
  if (keys === undefined) construction = `<div class="hint">${escape(word.slice(0, word.length - 1).join(" ") + word[word.length - 1])}</div>`;
  else {
    construction = `<div class="hint"><span>${escape(word[0])}</span>${word.length > 1 ? word[1] : ""}<table><tbody>`;
    for (var key of keys) { construction += `<tr class="row"><td colspan="${submeaning != undefined && submeaning.length > 0 ? submeaning.length : 1}">${escape(key)}</td></tr>`; }
    if (submeaning != undefined) {
       for (let i = 0; i < getLongestList(submeaning).length; i++) {
         construction += `<tr>`;
         for (var sub of submeaning) construction += `<td>${sub && sub.length > i ? escape(sub[i]) : ""}</td>`;
         construction += `</tr>`;
       }
     }
    construction += `</tbody></table></div>`;
  }
  return construction; 
}

function replaceClass(text, class_) { return text.replaceAll("[", `<span class=\"${class_}\">`).replaceAll("]", "</span>"); }

function getLongestList(nestedList) {
  let largest = [];
  nestedList.forEach(element => { if (element != undefined && element.length > largest.length) largest = element; });
  return largest;
}

function escape(text) { return text ? text.replaceAll("'", "&#x27;") : text; }

fastify.get("/",        function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index, units: lessons }); });
fastify.get("/learn",   function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index, units: lessons }); });
fastify.get("/lesson",  function (request, reply) { return reply.redirect('/learn'); });
fastify.post("/lesson", function (request, reply) { return reply.view('/src/lesson.hbs', {seo: seo, unitno: request.body.unit, lessons: lessons[request.body.unit].unit[request.body[request.body.unit + "-lesson"]]});});

const ulessons = require("./src/unreleased/lessons.json");
fastify.get("/learn/u",   function (request, reply) { return reply.view("/src/unreleased/learn.hbs", { seo: seo.index, units: ulessons }); });
fastify.post("/lesson/u",   function (request, reply) {
  console.log(request.body.unit);
  console.log(request.body.module);
  console.log(request.body["u0-m0"]);
  console.log(ulessons[0].modules[0].lessons[0]); 
  return reply.view("/src/lesson.hbs", { seo: seo.index, unitno: request.body.unit, lessons: ulessons[request.body.unit].modules[request.body.module].lessons[request.body["u" + request.body.unit + "-m" + request.body.module]] });
});

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
