const path = require("path");
const handlebars = require("handlebars");
const fastify = require("fastify")({ logger: false });

const seo = require("./src/json/seo.json");

const lessons = require("./src/json/lessons.json");
const dictionary = require("./src/json/dictionary.json");
let dict = dictionary.nórem;

fastify.register(require("@fastify/static"), { root: path.join(__dirname, "public"), prefix: "/" });

fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/view"), { engine: { handlebars: handlebars } });

handlebars.registerHelper('add', function(a, b) { return a + b; });
handlebars.registerHelper('ifEquals', function(arg1, arg2, options) { return (arg1 === arg2) ? options.fn(this) : options.inverse(this); });
handlebars.registerHelper('ternaryEq', function(arg1, arg2, op1, op2) { return (arg1 === arg2) ? op1 : op2; });
handlebars.registerHelper('json', function(a) { return JSON.stringify(a); });
handlebars.registerHelper('get-attribute', function(word, attribute) { return dict[word.trimEnd()][attribute]; });
handlebars.registerHelper('tip-format', function(arg) { return new handlebars.SafeString(arg.replace("[", "<span class=\"merienda accent\">").replace("]", "</span>")); });

handlebars.registerHelper('hover-translate', function(prompt, lang) {
  // han i mikol. => [["han"], ["i"], ["mikol", "."]]
  let tokens = [];
  for (var word of prompt.split(" ")) {
    let section = "";
    for (var letter of word) {
      if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/g.test(letter)) section += " ";
      section += letter;
    }
    tokens.push(section.split(" "));
  }
  if (lang === "native") return "native";
  else return hoverForeign(tokens);
});

function hoverForeign(tokens) {
  let string = "";
  let stored = "";

  for (var index in tokens) {
    let token = tokens[index];
    stored += token[0];

    if (index < tokens.length - 1 && stored + " " + tokens[parseInt(index) + 1][0] in dict) stored += " ";
    else {
      if (save.trimEnd().includes(" ")) { submeaning = save.toLowerCase().trimEnd().split(" ").map((key) => { return key in dict ? dict[key].simple : []; }); }
      string += formHints(token.length > 1 ? [stored, token[1]] : [stored], !(stored in dict) ? undefined : dict[stored].simple, submeaning);
      stored = "";
    }
  }
  return new handlebars.SafeString(string);
}

function formHints(word, keys, submeaning) {
  let construction = "";
  if (keys === undefined) construction = `<div class="hint">${word.join(" ").trimEnd()}</div>`;
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

handlebars.registerHelper('hover-translates', function(arg, lang) {
  let string = "";
  let save = "";
  
  let tokens = [];
  for (let i = 0; i < arg.length; i++) {
    if (arg[i] === "." || arg[i] === " ") { 
      tokens.push(save);
      save = "";
    }
    if (arg[i] != " ") save += arg[i];
  }
  if (save !== "") tokens.push(save);
  save = "";

  let keys = undefined;
  let submeaning = [];
  
  for (let i = 0; i < tokens.length; i++) {
    save += tokens[i] + " ";
    
    if (tokens[i] === "___") {
      string += `<div class="hint"><hr class="blank"></div>`;
      save = "";
      keys = undefined;
      submeaning = [];
      continue;
    } else if (tokens[i] === ".") {
      string += `<div class="punctuation">${tokens[i]}</div>`;
      save = "";
      keys = undefined;
      submeaning = [];
      continue;
    } else if (lang === "native" && getInComplexByLength(save.toLowerCase() + tokens[i + 1]) && getInComplexByLength(save.toLowerCase() + tokens[i + 1] + " " + tokens[i + 2])) {
      keys = Object.keys(dict).filter(key => getInComplex(key, save.trimEnd().toLowerCase()));
      if (save.trimEnd().includes(" ")) { submeaning = save.trimEnd().split(" ").map((v) => { return Object.keys(dict).filter(key => dict[key].simple.includes(v)); }); }
    } else if (lang === "foreign" && save.trimEnd() in dict && !(save.toLowerCase() + tokens[i + 1] in dict) && !(save.toLowerCase() + tokens[i + 1] + " " + tokens[i + 2] in dict)) {
      keys = dict[save.trimEnd().toLowerCase()].simple;
      if (save.trimEnd().includes(" ")) { submeaning = save.toLowerCase().trimEnd().split(" ").map((key) => { return key in dict ? dict[key].simple : []; }); }
    } else if (lang === "foreign" && save[0] === save[0].toUpperCase()) {} else continue;
    
    let construction;
    if (keys == undefined || keys.length >= 1) {
      construction = `<div class="hint"><span>${save.trimEnd(" ")}</span><table><tbody>`;
      for (var key of keys) { construction += `<tr class="row"><td colspan="${submeaning.length > 0 ? submeaning.length : 1}">${key}</td></tr>`; }
      if (submeaning.length > 0) {
        for (let i = 0; i < getLongestList(submeaning).length; i++) {
          construction += `<tr>`;
          for (var sub of submeaning) { construction += `<td>${sub.length > i ? sub[i] : ""}</td>`; } 
          construction += `</tr>`;
        }
      }
      construction += `</tbody></table></div>`;
    } else { construction = `<div class="hint">${save.trimEnd(" ")}</div>`; }
      
    string += construction;
    save = "";
    keys = undefined;
    submeaning = [];
  }
  
  return new handlebars.SafeString(string.trimEnd());
});

function getInComplexByLength(match) { return Object.keys(dict).filter(key => getInComplex(key, match)).length === 0; }
function getInComplex(key, match) { return dict[key].complex.includes(match); }

function getLongestList(nestedList) {
  let largest = [];
  nestedList.forEach(element => { if (element.length > largest.length) largest = element; });
  return largest;
}

fastify.get("/", function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index, units: lessons }); });
fastify.get("/lesson", function (request, reply) { return reply.redirect('/'); });
fastify.post("/lesson", function (request, reply) { return reply.view('/src/lesson.hbs', {seo: seo, unitno: request.body.unit, lessons: lessons[request.body.unit].unit[request.body[request.body.unit + "-lesson"]]});});

fastify.setNotFoundHandler(function(request, reply) { return reply.view("/src/error.hbs", { seo: seo.index, error: request.routeOptions.url }); });

fastify.listen({ port: process.env.PORT || 4000, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
