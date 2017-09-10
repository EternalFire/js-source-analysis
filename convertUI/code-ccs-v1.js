/**
 * Cocos Studio v1 UI File Structure
 *
 * *.json: 
 * 
 * {
 *   "classname": null,
 *   "name": null,
 *   "animation": {
 *     "classname": null,
 *     "name": "AnimationManager",
 *     "actionlist": []
 *   },
 *   "dataScale": 1,
 *   "designHeight": 342,
 *   "designWidth": 452,
 *   "textures": [
 *   "luaGameUI0.plist"
 *   ],
 *   "version": "1.3.0.0",
 *   "widgetTree": {
 *     "classname": "Panel",
 *     "name": null,
 *     "children":[],
 *     "options":{}
 *   }
 * }
 *
 * 
 * Feature
 * 
 * - generate code "class"
 * - generate code "getChildByName"
 * - generate code "definition and delete"
 * - generate code "listener"
 *
 * TODO
 * - scrollview listener
 * - other view listener
 * - read dir
 * - write file
 * - ui interface
 * - indent
 */

module.exports = main;
const print = console.log;

const {fileHelper} = require('../base');

const fs = require('fs');
const path = require('path');

const dir = 'ui';
const encoding = 'utf8';

async function main() {
  let files = await fileHelper.getFiles(dir);

  files = files.filter((filePath) => filePath.indexOf('ExportJson') != -1);

  console.log('files.length: ', files.length);
  console.log('main: ', JSON.stringify(files, null, '  '));

  files.forEach(function(element, index) {
    // let filePath = getPath(dir, element);
    let filePath = element;

    fs.readFile(filePath, encoding, (err, data) => {
      if (err) throw err;

      const {nodeList, relationDict, childDict} = parseJSONData(data);

      // dumpNodeList(nodeList);
      // 
      const plainNodeList = makePlainNodeList(nodeList);

      // const parentList = makeParentList(plainNodeList, childDict);
      // for (let parentIndex in parentList) {
      //   console.log(parentIndex + '  ' + parentList[parentIndex]);
      // }

      let param = {
        ccClassName: path.basename(element).split('.')[0], 
        uiFileName: element,

        plainNodeList,
        relationDict,
        childDict
      };      
      generateCode(param);
    });
  });
}


function parseJSONData(jsonData) {
  let object = JSON.parse(jsonData);
  let widgetTree = parseWidgetTree(object);

  return parseNode(widgetTree);
}

/**
 * parse dom node
 * @param  {object} node dom node
 * @return {object}      nodeList, relationDict, childDict
 */
function parseNode(node) {
  let layerCount = 0;
  let nodeList = [];      // [ layerIndex: nodes ]
  let relationDict = {};  // { parentIndex: childIndexList }
  let childDict = {};     // { childIndex: parentIndex }
  nodeList[layerCount] = [node];

  for (let i = 0; i < nodeList.length; i++) {
    const list = nodeList[i];
    layerCount++;

    for (let j = 0; j < list.length; j++) {
      const element = list[j];

      // node index
      let index = j;
      if (i > 0) {
        for (let k = 0; k < i; k++) {
          index += nodeList[k].length;
        }
      }

      // const layerIndex = i;
      // const indent = ' '.repeat(2).repeat(layerCount);
      // const name = parseNodeName(element);
      // const classname = parseClassName(element);      
      // console.log(index, layerIndex, indent, classname, name);

      // check node's children
      const children = parseChildren(element);    
      if (children && children.length > 0) {
        // push children
        nodeList[layerCount] = nodeList[layerCount] || [];
        nodeList[layerCount] = nodeList[layerCount].concat(children);
        
        // generate relationDict
        relationDict[index] = relationDict[index] || [];
        let countIndex = 0;
        for (let m = 0; m < layerCount; m++) {
          countIndex += nodeList[m].length;
        }

        for (let k = 0; k < children.length; k++) {
          relationDict[index].push(k + countIndex);
        }
      }
    }
  }

  // generate childDict
  for(let parentIndex in relationDict) {
    let childIndexList = relationDict[parentIndex];    
    if (childIndexList) {

      childIndexList.forEach((childIndex) => {
        if (childIndex != null) {
          childDict[childIndex] = parseInt(parentIndex);
        }
      });
    }
  }

  return { nodeList, relationDict, childDict };
}

function makePlainNodeList(nodeList) {
  let plainNodeList = [];

  for (let layerIndex in nodeList) {
    plainNodeList = plainNodeList.concat(nodeList[layerIndex]);    
  }

  return plainNodeList;
}

function makeParentList(plainNodeList, childDict) {
  let parentList = {};

  plainNodeList.forEach((node, index) => {
    let i = index;
    parentList[index] = [];

    while(childDict[i] != null) {
      let parentIndex = childDict[i];
      parentList[index].push(parentIndex);
      i = parentIndex;
    }

    parentList[index].reverse();
  });

  return parentList;
}

function dumpNodeList(nodeList) {
  let plainNodeList = makePlainNodeList(nodeList);

  plainNodeList.forEach((node, index) => {
    const name = parseNodeName(node);
    const classname = parseClassName(node);

    let text = makeDisplayText(index, {small:true}) 
             + makeDisplayText(classname) 
             + makeDisplayText(name, {all:true})
    ;

    console.log(text);
  });
}

/**
 * 格式化字符串, 用于输出文本
 * @param  {string} v     字符串值
 * @param  {object} param [description]
 * @return {[type]}       [description]
 */
function makeDisplayText(v, param) {
  let value = v;
  if (typeof value != 'string') {
    value = v + '';
  }

  let len = 18;
  if (param) {
    const {small, large, all, size} = param;
    if (small) {
      len = 14;
    } else if (large) {
      len = 25;
    } else if (all) {
      len = value.length;
    } else if (size) {
      len = size;
    }
  }

  if (value.length > len) {
    
    value = value.substring(0, len);

  } else if (value.length < len) {
    
    let times = len - value.length;
    value += ' '.repeat(times);
  }

  return value;
}

/**
 * get version code
 * @param  {object} root json file root
 * @return {string}      cocos studio ui file version
 */
function parseVersion(root) {
  if (root && root.version) {
    return root.version;
  }
}

function parseWidgetTree(root) {
  if (root && root.widgetTree) {
    return root.widgetTree;
  }
}

function parseOptions(node) {
  if (node && node.options) {
    return node.options;
  }
}

function parseChildren(node) {
  if (node && node.children) {
    return node.children;
  }
}

function parseClassName(node) {
  if (node && node.classname) {
    return node.classname;
  }
}

function parseNodeName(node) {
  if (node) {
    let options = parseOptions(node);
    if (options && options.name) {
      return options.name;
    }
  }
}

function isButton(node) {
  return parseClassName(node) == 'Button';
}

function isImageView(node) {
  return parseClassName(node) == 'ImageView';
}

function isLikeButton(node) {
  let name = parseNodeName(node);
  name.toLowerCase();
  return isButton(node) || 
    (isImageView(node) && (name.indexOf('btn') > -1 || name.indexOf('button') > -1))
  ;
}

function isLikeTab(node) {
  let name = parseNodeName(node);  
  let tabFlag = isTabFlag(name);
  return tabFlag && ( isButton(node) || isImageView(node) );
}

function isTabFlag(name) {
  let str = name;
  str.toLowerCase();
  return str.indexOf('tab') > -1;
}

/**
 * generate View Class
 * @param  {object} param 
 * @return {string}       View Class Template
 */
function generateCode(param) {
  const {
    ccClassName, 
    uiFileName,

    plainNodeList, 
    relationDict, 
    childDict
  } = param;

  let propertyList = [];


  function getPropertyList() {
    let list = [null];
    
    for(let childIndex in childDict) {
      let node = plainNodeList[childIndex];
      let name = parseNodeName(node);
      let property = '_' + name;
      list[childIndex] = property;
    }

    return list;
  }

  function getButtonLikedPropertyList() {
    return propertyList.filter((property, index) => {
      if (index != 0) {        
        return isLikeButton(plainNodeList[index]);
      }
      return false;
    });
  }

  function getTabLikedPropertyList() {
    return propertyList.filter((property, index) => {
      if (index != 0) {        
        return isLikeTab(plainNodeList[index]);
      }
      return false;
    });
  }

  function makeClassStr(p) {

    let classStr = '';
    let definitionStr = '';
    let deleteStr = '';

    let {bindStr, initListenerStr, listenerStr} = p;
    initListenerStr = initListenerStr || '';
    listenerStr = listenerStr || '';

    // generate definition
    propertyList.forEach((property, index) => {
      if (index != 0) {      
        definitionStr += ' '.repeat(4) + `${property}: null,\n`;
      }
    });

    // generate delete statement
    propertyList.forEach((property, index) => {
      if (index != 0) {      
        deleteStr += ' '.repeat(8) + `this.${property} = null;\n`;
      }
    });

    classStr = 
`var ${ccClassName} = cc.Class.extend({
${definitionStr}
    ctor: function() {
${bindStr}
        this.initView();
        this.initEvent();
    },

    initView: function() {
${initListenerStr}
    },
    
    initEvent: function() {

    },

    removeEvent: function() {

    },
${listenerStr}

    dispose: function() {
        this.removeEvent();

${deleteStr}
    },
});
`;
    return classStr;
  }

  function makeBindStr() {
    let bindStr = '';
    let strList = []; // [ {leftStr: '', rightStr: ''} ]

    for (let parentIndex in relationDict) {      
      const parentNode = plainNodeList[parentIndex];      
      let parentPropertyName = 'this';

      if (parentIndex != 0) {        
        parentPropertyName += '.' + propertyList[parentIndex];
      }

      const childIndexList = relationDict[parentIndex] || [];

      childIndexList.forEach((childIndex) => {        
        let leftStr = '';
        let rightStr = '';
        const childNode = plainNodeList[childIndex];
        const childName = parseNodeName(childNode);
        const propertyName = propertyList[childIndex];
        
        leftStr = `this.${propertyName}`;
        rightStr = `${parentPropertyName}.getChildByName("${childName}");`;
        strList.push({ leftStr, rightStr });
      });
    }// end for

    // find the longest 'left value text'
    let maxLeftStrLen = 0;
    strList.forEach((strObject) => {
      const len = strObject.leftStr.length;
      if (len > maxLeftStrLen) {
        maxLeftStrLen = len;
      }
    });

    // for pretty print
    strList.forEach((strObject) => {
      let left = makeDisplayText(strObject.leftStr, {size: maxLeftStrLen});
      let right = strObject.rightStr;
      let indent = ' '.repeat(8);
      bindStr += `${indent}${left} = ${right}\n`;
    });

    return bindStr;
  }

  function makeInitListenerStr() {    
    let buttonStr = makeInitButtonLikedListenerStr();

    let result = [buttonStr];
    return result.join('\n');
  }

  function makeInitButtonLikedListenerStr() {
    let str = '';

    getButtonLikedPropertyList().forEach((property, index) => {
      str += ' '.repeat(8) + `this.${property}.addListener(this, this.btnClickHandler);\n`;
    });

    return str;
  }

  function makeButtonLikedListenerStr() {
    let buttonPropertyList = getButtonLikedPropertyList();
    let conditionStatement = '';
    
    buttonPropertyList.forEach((property, index) => {
      if (index == 0) {
        conditionStatement += `
          if (sender == this.${property}) {

          }`;
      } else {
        conditionStatement += `
          else if (sender == this.${property}) {

          }`; 
      }
    });    

    let str = `
    btnClickHandler: function(sender, eventType) {
        if (eventType == ccui.Widget.TOUCH_ENDED) {
${conditionStatement}
        }
    },`;

    return str;
  }

  function makeInitTabLikedListenerStr() {
    return getTabLikedPropertyList().reduce((a, b) => {
      return a + `
        this.${b}.addListener(this, this.tabClickHandler);`;
    }, '');
  }

  function makeTabLikedListenerStr() {
    let str = `
    tabClickHandler: function(sender, eventType) {
        if (eventType == ccui.Widget.TOUCH_ENDED) {
            globalManager.soundManager.playSound(globalManager.soundManager.BTN);

        }
    },`;

    return str;

  }

  // 
  // 
  propertyList = getPropertyList();

  const bindStr = makeBindStr();
  const initListenerStr = makeInitListenerStr() + makeInitTabLikedListenerStr();
  const listenerStr = makeButtonLikedListenerStr();

  const viewClassTemplateStr = makeClassStr({
    bindStr, initListenerStr, listenerStr
  });

  console.log(viewClassTemplateStr);
  
  return viewClassTemplateStr;
}
