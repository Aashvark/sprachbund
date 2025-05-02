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
handlebars.registerHelper('link', function(arg, options) { return fma(arg); });
handlebars.registerHelper("json", function(a, options) { return JSON.stringify(a); });

function fma(name) { return name.replaceAll(" ", "_"); }

handlebars.registerHelper('hover-translate', function(arg, lang, options) {
  let string = "";
  let save = "";
  
  for (let i = 0; i < arg.length; i++) {
    let c = arg.charAt(i);
    save += c;
    
    if (c === " " || i == arg.length - 1) { 
      let keys = [];
      let submeaning = [];
      if (lang == "en") { keys = Object.keys(dictionary.smb).filter(key => dictionary.smb[key].includes(save.trimEnd())); }
      else if (lang == "smb" && save.trimEnd() in dictionary.smb) { 
        keys = dictionary.smb[save.trimEnd()];
        if (save.trimEnd().includes(" ")) {
          for (var sub of save.trimEnd().split(" ")) {
            if (sub in dictionary.smb) submeaning.push(dictionary.smb[sub]);
            else submeaning.push(" ")
          }
        }
      }
      else continue;
      
      let construction = `<div class="hint"><span>${save}</span><table><tbody></tbody></table></div>`;
      
      //let construction = `<div class="hint"><span>${save}</span><div class="hints">`;
      //for (var key of keys) { construction += `<div class="row"><p class="row-whole">${key}</p></div>`; }
      //if (submeaning !== []) {
      //  construction += `<div class="row">`;
      //  for (var sub of submeaning) { construction += `<p class="row-split">${sub}</p>`; } 
      //  construction += `</div>`;
      //}
      //construction += "</div></div>"
      
      string += construction;
      save = "";
    }
  }
  
  return new handlebars.SafeString(string.trimEnd());
});

const seo = require("./src/seo.json");

const lessons = require("./src/lessons.json");
const dictionary = require("./src/dictionary.json");

fastify.get("/", function (request, reply) { return reply.view("/src/index.hbs", { seo: seo.index }); });
fastify.setNotFoundHandler(function(request, reply) { return reply.view("/src/error.hbs", { seo: seo.index, error: request.routeOptions.url }); });

fastify.get("/learn", function (request, reply) {
  return reply.view('/src/pages/learn/learn.hbs', {seo: seo, lessons: lessons});
});

fastify.get("/lesson", function (request, reply) {
  return reply.view('/src/lesson.hbs', {seo: seo, lessons: lessons[0].unit[0]});
  //return reply.redirect('/learn');
});

fastify.post("/learn/lesson", function (request, reply) {
  return reply.view('/src/pages/learn/lesson.hbs', {seo: seo, lessons: lessons[request.body.lesson].lessons});
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
