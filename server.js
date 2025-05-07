const path = require("path");
const handlebars = require("handlebars");
const fastify = require("fastify")({ logger: false });

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/view"), { engine: { handlebars: handlebars } });

handlebars.registerHelper('ifEquals', function(arg1, arg2, options) { return (arg1 == arg2) ? options.fn(this) : options.inverse(this); });
handlebars.registerHelper("json", function(a, options) { return JSON.stringify(a); });
handlebars.registerHelper('get-attribute', function(word, attribute, options) { return dictionary.smb[word.trimEnd()][attribute]; });

handlebars.registerHelper('hover-translate', function(arg, lang, options) {
  let string = "";
  let save = "";
  
  let tokens = arg.replaceAll("she ", "it ").replaceAll("he ", "it ").split(" ");
  let keys = [];
  let submeaning = [];
  
  for (let i = 0; i < tokens.length; i++) {
    save += tokens[i] + " ";
    
    if (lang === "en" && Object.keys(dictionary.smb).filter(key => dictionary.smb[key].simple.includes(save + tokens[i + 1])).length === 0) {
      keys = Object.keys(dictionary.smb).filter(key => dictionary.smb[key].simple.includes(save.trimEnd()));
      if (save.trimEnd().includes(" ")) { submeaning = save.trimEnd().split(" ").map((v) => { return Object.keys(dictionary.smb).filter(key => dictionary.smb[key].simple.includes(v)); }); }
    } else if (lang == "smb" && save.trimEnd() in dictionary.smb && !(save + tokens[i + 1] in dictionary.smb)) {
      keys = dictionary.smb[save.trimEnd()].simple;
      if (save.trimEnd().includes(" ")) { submeaning = save.trimEnd().split(" ").map((key) => { return key in dictionary.smb ? dictionary.smb[key].simple : []; }); }
    } else continue;
    
    let construction = `<div class="hint"><span>${save}</span><table><tbody>`;
    for (var key of keys) { construction += `<tr class="row"><td colspan="${submeaning !== [] ? submeaning.length : 1}">${key}</td></tr>`; }
    if (submeaning !== []) {
      for (let i = 0; i < getLongestList(submeaning).length; i++) {
        construction += `<tr>`;
        for (var sub of submeaning) { construction += `<td>${sub.length > i ? sub[i] : ""}</td>`; } 
        construction += `</tr>`;
      }
    }
    construction += `</tbody></table></div>`;
      
    string += construction;
    save = "";
    keys = [];
    submeaning = [];
  }
  
  return new handlebars.SafeString(string.trimEnd());
});

function getLongestList(nestedList) {
  let largest = [];
  nestedList.forEach(element => { if (element.length > largest.length) largest = element; });
  return largest;
}

const seo = require("./src/seo.json");

const lessons = require("./src/lessons.json");
const dictionary = require("./src/dictionary.json");

fastify.get("/", function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index, units: lessons }); });
fastify.setNotFoundHandler(function(request, reply) { return reply.view("/src/error.hbs", { seo: seo.index, error: request.routeOptions.url }); });

fastify.get("/lesson", function (request, reply) {
  return reply.redirect('/');
});

fastify.post("/lesson", function (request, reply) {
  return reply.view('/src/lesson.hbs', {seo: seo, unitno: request.body.unit, lessons: lessons[request.body.unit].unit[request.body[request.body.unit + "-lesson"]]});
});

fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
