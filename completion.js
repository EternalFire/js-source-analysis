/// 生成 .sublime-completions 内容
module.exports = Completion;

function Completion() {
  this.scope = "source.js";
  this.completions = [];
  this.create = create;
  this.createNode = createNode;
  this.toString = toString;
};

function toString() {
  return JSON.stringify(this, null, '  ');
}

function create(className, methodName, params) {
  var trigger = createTrigger(className, methodName);
  var contents = createContents(className, methodName, params);
  this.createNode(trigger, contents);
}

function createNode(trigger, contents) {
  trigger = trigger || "";
  contents = contents || "";
  this.completions.push({trigger, contents});
}

/**
 * 创建触发API提示的关键字, 如"A.method"
 * @param  {String} className  类名, 可以为空
 * @param  {String} methodName 方法名
 * @param  {String} op         调用符号, 默认"."
 * @return {String}            "类名.方法名" 或 "方法名"
 */
function createTrigger(className, methodName, op) {
  op = op || ".";
  className = className || "";
  methodName = methodName || "methodNameUNKNOWN";

  if (className.length > 0) {
    return className + op + methodName;    
  } else {
    return methodName;
  }
}

/**
 * 创建API原型
 * @param  {String} className  类名, 可以为空
 * @param  {String} methodName 方法名
 * @param  {Array} params      参数数组
 * @return {String}            "类名.方法名(参数0,参数1,参数2)"
 */
function createContents(className, methodName, params) {
  className = className || "";
  methodName = methodName || "methodNameUNKNOWN";
  params = params || [];
  var comma = ", ";
  var contents = "";

  contents = createTrigger(className, methodName) + "(";

  if (params.length > 0) {
    params.forEach(function(element, index) {
      contents += element + comma;
    });
    contents = contents.substring(0, contents.length - comma.length);
  }

  contents +=  ")";
  
  return contents;
}
