
const fs = require('fs')
const path = require('path')
const esprima = require('esprima')
const Completion = require('./completion')

const Program = "Program";
const FunctionDeclaration = "FunctionDeclaration";

// fs.readFile(path.join(__dirname, 'GameConfig.js'), 'utf8', (err, data) => {
//   if (err) throw err;  

//   // console.log(data)
//   let result = esprima.parse(data)
//   // let result = esprima.tokenize(data)
//   console.log(result)

//   // 读取类名
//   console.log(result.body[0].declarations[0].id.name)

//   // 读取成员名字和值
//   console.log(result.body[0].declarations[0].init.arguments[0].properties[0].key.name)
//   console.log(result.body[0].declarations[0].init.arguments[0].properties[0].value.value)
//   console.log(result.body[0].declarations[0].init.arguments[0].properties[1].key.name)
//   console.log(result.body[0].declarations[0].init.arguments[0].properties[1].value.value)  
// });

function printError() {
  console.log.apply(null, ['ERROR: '].concat(Array.prototype.slice.call(arguments)));
}


function isNull(node) {
  if (!node) {
    printError('node is null');
    return true;
  }
  return false;
}

function isProgram(node) {
  var result = false;

  if (isNull(node)) {
    return result;
  }
  
  if (node.type && node.type == Program) {
    result = true;
  } else {
    printError('node.type is not Program ');
  }

  return result;
}

function isFunctionDeclaration(node) {
  var result = false;

  if (isNull(node)) {
    return result;
  }

  if (node.type && node.type == FunctionDeclaration) {
    result = true;
  } else {
    printError('node.type is not FunctionDeclaration ');
  }  

  return result;
}

function parseFunctionDeclaration(node) {
  var result = {
    name: '',
    params: []
  };

  if (!isFunctionDeclaration(node)) {
    return false;
  }

  result.name = node.id.name;
  node.params.forEach(function(e) {
    result.params.push(e.name);
  })
  
  return result;
}

function parseProgram(node) {
  var result = [];

  if (!isProgram(node)) {
    return false;
  }

  result = node.body;

  return result;
}

function createFunctionCompletion(completion, name, params) {
  if (completion) {
    completion.create(null, name, params);
  } else {
    printError('completion object is null');
  }
}

function test() {
  var data = `
function A(arg0, arg1) {
  
  return arg0 + arg1;
}  
  `;


  var program = esprima.parse(data);
  var body = parseProgram(program);
  var node = body[0];
  var result = parseFunctionDeclaration(node);

  var completion = new Completion();
  if (result) {
    createFunctionCompletion(completion, result.name, result.params);
  }

  console.log(completion.toString());
}

function testCompletion() {
  var c = new Completion();
  c.create("A", "functaaa",["a0", "a1"]);
  c.create("A", "functaaa1231",["a0", "a1"]);
  c.create(null, "functabbb1",["a0", "a1"]);
  console.log(c.toString());  
}

test();
// testCompletion();
