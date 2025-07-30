const fs         = require("fs");
const path       = require("path");
const fastify    = require("fastify") ( { logger: false } );

const seo        = require("./public/json/seo.json");
const units      = require("./public/json/units.json");
let { handlebars, hoverNative, hoverForeign, escape, dict } = require("./hover.js");

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

function replaceClass(text, class_) { return text.replaceAll("[", `<span class=\"${class_}\">`).replaceAll("]", "</span>"); }

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
