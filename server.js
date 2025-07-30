const fs         = require("fs");
const path       = require("path");
const handlebars = require("handlebars");
const fastify    = require("fastify") ( { logger: false } );

const seo        = require("./public/json/seo.json");
const dictionary = require("./public/json/dictionary.json");
const units      = require("./public/json/units.json");

let language = "nóri";
let dict     = dictionary[language];
let grammar  = dictionary[`${language}-grammar`];

fastify.register(require("@fastify/static"), { root: path.join(__dirname, "public"), prefix: "/" });
fastify.register(require("@fastify/view"), { engine: { handlebars: handlebars } });
fastify.register(require("@fastify/formbody"));

handlebars.registerHelper('eq',  function (a, b)  { return a == b; });
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

  let toks = [];
  let sorted = "";
  for (let token of tokens) {
    sorted += " " + token[0].toLowerCase();
    if (token.length == 2 || findmatchingsimple(sorted).includes(undefined)) {
      toks.push(token.length == 2 ? [sorted.trimStart(), token[1]] : [sorted.trimStart()]);
      sorted = "";
    }
  }

  let temp;
  let stored = [];
  for (let index in toks) {
    let token = toks[index];
    stored.push(token[0]);

    if (index != 0 && matchSelector(stored).length === 0 || token.length === 2 || index === toks.length - 1) {
      if ((token.length != 2 || index < toks.length - 1)) temp = stored.pop();
      if (index == 1 && stored.length == 2 && token.length === 2) {
        string += hint([stored[0]], toks[0]);
        string += hint([stored[1]], token);
        temp = undefined;
      } else string += hint(stored, token);
      stored = token.length === 2 || index === toks.length - 1 || temp === undefined ? [] : [temp];
    }
  }
  return new handlebars.SafeString(string);
}

function hint(stored, token) {
  let generated = generateNativeKeys(stored);
  return formHints(token.length > 1 ? [stored.join(" "), token[1]] : [stored.join(" ")], generated[0], generated[1]);
}

function filterBy(by, match) { return Object.keys(dict).filter(key => by in dict[key] && dict[key][by].includes(match.trim())) }
function findmatchingsimple(match) {
    let val = filterBy("simple", match)[0];
    return [val, dict[val]];
}

function matchSelector(phrase) {
  for (template of Object.keys(grammar.templates)) {
    for (let temp of grammar.templates[template].match) {
      if (phrase.length === temp.split(" ").length && temp.toLowerCase().split(" ").filter((word, index) => {
        if (word.at(0) != "[" && word === phrase[index]) return true;
        else if (word.at(0) === "[") {
          let find = findmatchingsimple(phrase[index].substring(0, phrase[index].length - (word.length - word.indexOf("]") - 1)));
          return find[0] === undefined ? false : word.substring(1, word.indexOf("]")) === find[1].pos; 
        }
      }).length === temp.split(" ").length) return [template, temp];
    }
  }
  return filterBy("match", phrase.join(" ")); 
}

function generateNativeKeys(phrase) {
  let match = matchSelector(phrase);  
  let entry = filterBy("match", phrase.join(" "));
  let submeaning = phrase.map(v => filterBy("simple", v));

  if (entry.length == 0 && match.length != 0) {
    let slots = phrase.map((word, index) => {
      if (match[1].split(" ")[index].at(0) != "[") return false;
      let section = match[1].split(" ")[index];
      return word.substring(0, word.length - (section.length - section.indexOf("]") - 1));
    }).filter(word => word);
    entry = [match[0]];
    for (let slot of slots) {
      let matching = findmatchingsimple(slot);
      entry[0] = entry[0].replace('[' + matching[1].pos + ']', matching[0]);
    }
  }
  return [entry, phrase.length == 1 || match.length > 1 && (!match[1].match(/\[/g) || match[1].match(/\[/g).length <= 1) ? undefined : submeaning];
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

fastify.get("/",        function (request, reply) { return reply.view("/src/learn.hbs", { seo: seo, units: units }); });
fastify.get("/learn",   function (request, reply) { return reply.view("/src/learn.hbs", { seo: seo, units: units }); });
fastify.get("/lesson",  function (request, reply) { return reply.redirect('/learn'); });
fastify.post("/lesson",   function (request, reply) { return reply.view("/src/lesson.hbs", { seo: seo, id: `u${request.body.unit}-m${request.body.module}`, modlen: fs.readdirSync(`./public/json/u${request.body.unit}-m${request.body.module}`).length, lessons: require(`./public/json/u${request.body.unit}-m${request.body.module}/${request.body.lesson}.json`), isTest: request.body.lesson === "test" }); });

fastify.setNotFoundHandler(function(request, reply) { return reply.view("/src/error.hbs", { seo: seo, error: request.routeOptions.url }); });

fastify.listen({ port: process.env.PORT || 4000, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  }
);
