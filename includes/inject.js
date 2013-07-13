// ==UserScript==
// @include https://plus.google.com/*
// ==/UserScript==

var Start_Tag_Re=/{rot13}/;
var Start_Tag_Len=7;

// expects a-zA-Z on input
function rotLetter(a)
{
  return String.fromCharCode(a.charCodeAt(0) + (a.toLowerCase()<'n'?13:-13));
}

// traverse throught nodes,
// pass text nodes to callback 'f'
function runText(elem, f)
{
  // text node
  if (elem.nodeType == 3)
  {
    return f(elem);
  }

  // iterate over children recursively
  elem = elem.firstChild;
  if (elem)
  {
    do
    {
      var ret = runText(elem, f);
      if (ret) {
        return ret;
      }
    }
    while (elem = elem.nextSibling);
  }
  return 0;
}

// first class citizen, return function, it's goal
// is simple, derot all the stuff after Start_Tag_Re
// has been found
function Unrot()
{
  var m_doUnrot=0;
  return function(t) {
    var d=t.data;
    if (m_doUnrot)
    {
      t.data = d.replace(/[a-zA-Z]/g, rotLetter);
    }
    var start = d.search(Start_Tag_Re);
    if (start != -1)
    {
      m_doUnrot = 1;
      t.data = d.slice(0, start+Start_Tag_Len) + d.slice(start+Start_Tag_Len).replace(/[a-zA-Z]/g, rotLetter);
    }
    return 0;
  }
}

// first class citizen, return function, it's goal
// is to find Start_Tag_Re and change it to link
function LinkRot(mainElem)
{
  var m_mainElem = mainElem;
  return function(t) {
    var d = t.data;
    var start = d.search(Start_Tag_Re);
    if (start != -1) {
      var ttt = t.parentNode;
      var before = d.slice(0, start);
      var after = d.slice(start);
  
      var spn = document.createElement("span");
      var txt = document.createTextNode(before);
      var lnk = document.createElement("a");
      lnk.appendChild(document.createTextNode(after));
      lnk.onclick = function() {
        runText(m_mainElem, Unrot());
      }
  
      spn.appendChild(txt);
      spn.appendChild(lnk);
      ttt.replaceChild(spn, t);
      // debug
      // opera.postError(ttt.innerHTML);
      return 1;
    }
    return 0;
  }
}

window.addEventListener('DOMContentLoaded', function(temp) {
  var links = document.querySelectorAll('div.wm');
  var len = links.length;
  if (len >= 0)
  {
    for (var i = 0; i < len; i++)
    {
      runText(links[i].firstChild, LinkRot(links[i].firstChild));
    }
  }    
}, false);

