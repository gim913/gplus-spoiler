var Start_Tag_Re=/{rot13}/;
var Start_Tag_Len=7;
var End_Tag_Re=/{\/rot13}/;
var End_Tag_Len=8;

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
    // this one will be called recursievely, to unrot all chunks
    function unrotText(textData) {
      if (m_doUnrot)
      {
        var end = textData.search(End_Tag_Re);
	if (end != -1) {
	    m_doUnrot = 0;
	    // decoded + [drop the end tag] + process(rest)
            return textData.slice(0, end).replace(/[a-zA-Z]/g, rotLetter) + unrotText(textData.slice(end+End_Tag_Len));
	}
        return textData.replace(/[a-zA-Z]/g, rotLetter);
      }
      var start = textData.search(Start_Tag_Re);
      if (start != -1)
      {
        m_doUnrot = 1;
	// plain + [drop the start tag] + process(rest)
        return textData.slice(0, start) + unrotText(textData.slice(start+Start_Tag_Len));
      }
      // if we'll here, means we just need to return as is
      return textData;
    }
    t.data = unrotText(t.data);
    return 0;
  }
}

// first class citizen, return function, it's goal
// is to find Start_Tag_Re and change it to link
function LinkRot(mainElem)
{
  var m_mainElem = mainElem;
  return function rec(t) {
    var d = t.data;
    var start = d.search(Start_Tag_Re);
    if (start != -1) {
      var ttt = t.parentNode;
      // already have link, do not add another one
      if (ttt.tagName.toUpperCase() == 'A') {
        return 1;
      }
      var before = d.slice(0, start);
      var after = d.slice(start);

      //console.log('ok got starting tag:' + before + ' ::: ' + after + ' ::: ' + ttt);
  
      var spn = document.createElement("span");
      var txt = document.createTextNode(before);
      var lnk = document.createElement("a");
      var rst = lnk.appendChild(document.createTextNode(after));
      lnk.onclick = function() {
        runText(m_mainElem, Unrot());
      }
  
      spn.appendChild(txt);
      spn.appendChild(lnk);
      ttt.replaceChild(spn, t);

      return 1;
    }
    return 0;
  }
}

function createRotLinks()
{
  var links = document.querySelectorAll('div.wm');
  var len = links.length;
  if (len >= 0)
  {
    //console.log('got ' + len + ' divs');
    for (var i = 0; i < len; i++)
    {
      runText(links[i].firstChild, LinkRot(links[i].firstChild));
    }
    //console.log('loop done');
  }    
}

// in manifest there is document_idle,
// so script will execute AFTER DOM has been loaded
//
createRotLinks();
  
// g+ is ugly ;p on community page it creates longer posts dynamically,
// by calling some func, which creates 'bigger' div, and hides the 'preview' one
// so the idea is to intercept click on 'Read more' button, and run my code again...
//
var rdmore = document.querySelectorAll('span.syxni');
var len = rdmore.length;
for (var i = 0; i < len; ++i)
{
  rdmore[i].addEventListener('click', function(e) {
    // since we're in more or less proper place (in DOM),
    // it would be nicer to start it somewhere there
    // instead of running createRotLinks to traverse whole tree...
    //
    // I'm delaying it a bit, as I dunno right now,
    // how to do it properly and call our func,
    // after dom has been changed (by that g+ func)
    window.setTimeout(function(){createRotLinks();},10);
  });
}

