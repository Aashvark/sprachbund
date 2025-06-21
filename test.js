const path = require("path");
const handlebars = require("handlebars");
const fastify = require("fastify")({ logger: false });

const seo = require("./src/json/seo.json");

const lessons = require("./src/json/lessons.json");
const dictionary = require("./src/json/dictionary.json");

let language = "nórem";
let dict     = dictionary[language];
let grammar  = dictionary[`${language}-grammar`]; 

function hoverNative(tokens) {
  let string = "";
  let stored = "";

  for (var index in tokens) {
    let token = tokens[index];
    let next = parseInt(index) + 1;
    stored += token[0];

    if (index < tokens.length - 1 && matchSelector(stored + " " + tokens[next][0]) && token.length === 1) stored += " ";
    else {
      let generated = generateN(stored.toLowerCase());
      string += formHints(token.length > 1 ? [stored, token[1]] : [stored], generated[0], generated[1]);
      stored = "";
    }
  }
  return new handlebars.SafeString(string);
}

function matchCluster(phrase) {
  let words = phrase.toLowerCase().split(" ").map(word => word in dict ? [word, dict[word]] : undefined);
  if (words.includes(undefined)) return undefined;
  for (template of Object.keys(grammar["templates"])) {
     if (words.length === template.split(" ").length && !template.split(" ").map((word, index) => word.at(0) != "[" && word === words[index][0] || word.at(0) === "[" && word.substring(1, word.length - 1) === words[index][1].pos).includes(false)) return grammar["templates"][template];
  }
  return undefined; 
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
      if (words.length === temp.split(" ").length && temp.split(" ").filter((word, index) => {
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
  return [ret, ret.length === 1 ? undefined : submeaning];
}

function generateKeys(phrase) {
  let match = matchCluster(phrase);
  let submeaning;
  if (phrase.includes(" ")) submeaning = phrase.split(" ").map((key) => key in dict && "hint" in dict[key] ? dict[key].hint : generateKeys(key)[0]);
  if (!(phrase in dict && dict[phrase].hint) && match) {
    let words = phrase.toLowerCase().split(" ").map((word) => dict[word]);
    let hints = [];
    match.hint.forEach((template) => {
      if (!template.includes("[")) hints.push(template);
      let chosen = [];
      for (let word of template.split(" ")) {
        let pos = words.map((w) => w.pos || "");
        if (word[0] === "[" && pos.includes(word.substring(1, word.indexOf("]")))) chosen.push(words[pos.indexOf(word.substring(1, word.indexOf("]")))]);
      }
      for (let chose of chosen) {
        for (let l of chose.simple) hints.push(template.replaceAll(`[${chose.pos || ""}]`, l));
      }
    });
    return [hints, submeaning];
  }
  return [phrase in dict ? dict[phrase].hint : undefined, submeaning];
}

function getLongestList(nestedList) {
  let largest = [];
  nestedList.forEach(element => { if (element.length > largest.length) largest = element; });
  return largest;
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

console.log(hoverNative([["A"], ["woman", "."]]));
console.log(hoverNative([["She"], ["exists", "."]]));