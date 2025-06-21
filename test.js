const path = require("path");
const handlebars = require("handlebars");
const fastify = require("fastify")({ logger: false });

const seo = require("./src/json/seo.json");

const lessons = require("./src/json/lessons.json");
const dictionary = require("./src/json/dictionary.json");

let language = "nórem";
let dict     = dictionary[language];
let grammar  = dictionary[`${language}-grammar`]; 

function isInDictionary(match) { return Object.keys(dict).filter(key => "match" in dict && dict[key].match.includes(match.toLowerCase())).length !== 0; }
function findmatchingsimple(match) {
  return dict[Object.keys(dict).filter(key => "simple" in dict[key] && dict[key].simple.includes(match))[0]]; }

function matchSelector(phrase) {
  if (isInDictionary(phrase.toLowerCase())) return Object.keys(dict).filter(key => dict[key].includes(stored));
  let words = phrase.toLowerCase().split(" ");

  for (template of Object.keys(grammar["templates"]).map(key => grammar["templates"][key])) {
    for (let temp of template.match) {
      // [noun]
      if (words.length === temp.split(" ").length && temp.split(" ").filter((word, index) => {
        if (word.at(0) != "[" && word === words[index]) return true;
        else if (word.at(0) === "[") {
          let find = findmatchingsimple(words[index].substring(0, words[index].length - (word[word.length - 1] === "s" ? 1 : 0)));
          if (find === undefined) return false;
          return word.substring(1, word.indexOf("]")) === find.pos; 
        }
      }).length != 0) return template;
    }
  }
  return undefined; 
}

console.log(matchSelector("she eats"));