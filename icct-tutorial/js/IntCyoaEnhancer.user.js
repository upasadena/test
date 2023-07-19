/* 
IntCyoaEnhancer.user.js by Agregen (https://agregen.gitlab.io/)
*/

window.VMj3k905trele=function VM2cgznlnlgyx(GM,VM2cgznlnlgyx){try{with(this)with(c)delete c,((define,module,exports)=>{require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  "use strict"
  
  var Vnode = require("../render/vnode")
  
  module.exports = function(render, schedule, console) {
    var subscriptions = []
    var pending = false
    var offset = -1
  
    function sync() {
      for (offset = 0; offset < subscriptions.length; offset += 2) {
        try { render(subscriptions[offset], Vnode(subscriptions[offset + 1]), redraw) }
        catch (e) { console.error(e) }
      }
      offset = -1
    }
  
    function redraw() {
      if (!pending) {
        pending = true
        schedule(function() {
          pending = false
          sync()
        })
      }
    }
  
    redraw.sync = sync
  
    function mount(root, component) {
      if (component != null && component.view == null && typeof component !== "function") {
        throw new TypeError("m.mount expects a component, not a vnode.")
      }
  
      var index = subscriptions.indexOf(root)
      if (index >= 0) {
        subscriptions.splice(index, 2)
        if (index <= offset) offset -= 2
        render(root, [])
      }
  
      if (component != null) {
        subscriptions.push(root, component)
        render(root, Vnode(component), redraw)
      }
    }
  
    return {mount: mount, redraw: redraw}
  }
  
  },{"../render/vnode":8}],2:[function(require,module,exports){
  "use strict"
  
  var render = require("./render")
  
  module.exports = require("./api/mount-redraw")(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)
  
  },{"./api/mount-redraw":1,"./render":"mithril/render"}],3:[function(require,module,exports){
  "use strict"
  
  var Vnode = require("../render/vnode")
  var hyperscriptVnode = require("./hyperscriptVnode")
  
  module.exports = function() {
    var vnode = hyperscriptVnode.apply(0, arguments)
  
    vnode.tag = "["
    vnode.children = Vnode.normalizeChildren(vnode.children)
    return vnode
  }
  
  },{"../render/vnode":8,"./hyperscriptVnode":5}],4:[function(require,module,exports){
  "use strict"
  
  var Vnode = require("../render/vnode")
  var hyperscriptVnode = require("./hyperscriptVnode")
  var hasOwn = require("../util/hasOwn")
  
  var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
  var selectorCache = {}
  
  function isEmpty(object) {
    for (var key in object) if (hasOwn.call(object, key)) return false
    return true
  }
  
  function compileSelector(selector) {
    var match, tag = "div", classes = [], attrs = {}
    while (match = selectorParser.exec(selector)) {
      var type = match[1], value = match[2]
      if (type === "" && value !== "") tag = value
      else if (type === "#") attrs.id = value
      else if (type === ".") classes.push(value)
      else if (match[3][0] === "[") {
        var attrValue = match[6]
        if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
        if (match[4] === "class") classes.push(attrValue)
        else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true
      }
    }
    if (classes.length > 0) attrs.className = classes.join(" ")
    return selectorCache[selector] = {tag: tag, attrs: attrs}
  }
  
  function execSelector(state, vnode) {
    var attrs = vnode.attrs
    var hasClass = hasOwn.call(attrs, "class")
    var className = hasClass ? attrs.class : attrs.className
  
    vnode.tag = state.tag
    vnode.attrs = {}
  
    if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
      var newAttrs = {}
  
      for (var key in attrs) {
        if (hasOwn.call(attrs, key)) newAttrs[key] = attrs[key]
      }
  
      attrs = newAttrs
    }
  
    for (var key in state.attrs) {
      if (hasOwn.call(state.attrs, key) && key !== "className" && !hasOwn.call(attrs, key)){
        attrs[key] = state.attrs[key]
      }
    }
    if (className != null || state.attrs.className != null) attrs.className =
      className != null
        ? state.attrs.className != null
          ? String(state.attrs.className) + " " + String(className)
          : className
        : state.attrs.className != null
          ? state.attrs.className
          : null
  
    if (hasClass) attrs.class = null
  
    for (var key in attrs) {
      if (hasOwn.call(attrs, key) && key !== "key") {
        vnode.attrs = attrs
        break
      }
    }
  
    return vnode
  }
  
  function hyperscript(selector) {
    if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
      throw Error("The selector must be either a string or a component.");
    }
  
    var vnode = hyperscriptVnode.apply(1, arguments)
  
    if (typeof selector === "string") {
      vnode.children = Vnode.normalizeChildren(vnode.children)
      if (selector !== "[") return execSelector(selectorCache[selector] || compileSelector(selector), vnode)
    }
  
    vnode.tag = selector
    return vnode
  }
  
  module.exports = hyperscript
  
  },{"../render/vnode":8,"../util/hasOwn":9,"./hyperscriptVnode":5}],5:[function(require,module,exports){
  "use strict"
  
  var Vnode = require("../render/vnode")
  
  // Call via `hyperscriptVnode.apply(startOffset, arguments)`
  //
  // The reason I do it this way, forwarding the arguments and passing the start
  // offset in `this`, is so I don't have to create a temporary array in a
  // performance-critical path.
  //
  // In native ES6, I'd instead add a final `...args` parameter to the
  // `hyperscript` and `fragment` factories and define this as
  // `hyperscriptVnode(...args)`, since modern engines do optimize that away. But
  // ES5 (what Mithril.js requires thanks to IE support) doesn't give me that luxury,
  // and engines aren't nearly intelligent enough to do either of these:
  //
  // 1. Elide the allocation for `[].slice.call(arguments, 1)` when it's passed to
  //    another function only to be indexed.
  // 2. Elide an `arguments` allocation when it's passed to any function other
  //    than `Function.prototype.apply` or `Reflect.apply`.
  //
  // In ES6, it'd probably look closer to this (I'd need to profile it, though):
  // module.exports = function(attrs, ...children) {
  //     if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
  //         if (children.length === 1 && Array.isArray(children[0])) children = children[0]
  //     } else {
  //         children = children.length === 0 && Array.isArray(attrs) ? attrs : [attrs, ...children]
  //         attrs = undefined
  //     }
  //
  //     if (attrs == null) attrs = {}
  //     return Vnode("", attrs.key, attrs, children)
  // }
  module.exports = function() {
    var attrs = arguments[this], start = this + 1, children
  
    if (attrs == null) {
      attrs = {}
    } else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
      attrs = {}
      start = this
    }
  
    if (arguments.length === start + 1) {
      children = arguments[start]
      if (!Array.isArray(children)) children = [children]
    } else {
      children = []
      while (start < arguments.length) children.push(arguments[start++])
    }
  
    return Vnode("", attrs.key, attrs, children)
  }
  
  },{"../render/vnode":8}],6:[function(require,module,exports){
  "use strict"
  
  var Vnode = require("../render/vnode")
  
  module.exports = function($window) {
    var $doc = $window && $window.document
    var currentRedraw
  
    var nameSpace = {
      svg: "http://www.w3.org/2000/svg",
      math: "http://www.w3.org/1998/Math/MathML"
    }
  
    function getNameSpace(vnode) {
      return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
    }
  
    //sanity check to discourage people from doing `vnode.state = ...`
    function checkState(vnode, original) {
      if (vnode.state !== original) throw new Error("'vnode.state' must not be modified.")
    }
  
    //Note: the hook is passed as the `this` argument to allow proxying the
    //arguments without requiring a full array allocation to do so. It also
    //takes advantage of the fact the current `vnode` is the first argument in
    //all lifecycle methods.
    function callHook(vnode) {
      var original = vnode.state
      try {
        return this.apply(original, arguments)
      } finally {
        checkState(vnode, original)
      }
    }
  
    // IE11 (at least) throws an UnspecifiedError when accessing document.activeElement when
    // inside an iframe. Catch and swallow this error, and heavy-handidly return null.
    function activeElement() {
      try {
        return $doc.activeElement
      } catch (e) {
        return null
      }
    }
    //create
    function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
      for (var i = start; i < end; i++) {
        var vnode = vnodes[i]
        if (vnode != null) {
          createNode(parent, vnode, hooks, ns, nextSibling)
        }
      }
    }
    function createNode(parent, vnode, hooks, ns, nextSibling) {
      var tag = vnode.tag
      if (typeof tag === "string") {
        vnode.state = {}
        if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
        switch (tag) {
          case "#": createText(parent, vnode, nextSibling); break
          case "<": createHTML(parent, vnode, ns, nextSibling); break
          case "[": createFragment(parent, vnode, hooks, ns, nextSibling); break
          default: createElement(parent, vnode, hooks, ns, nextSibling)
        }
      }
      else createComponent(parent, vnode, hooks, ns, nextSibling)
    }
    function createText(parent, vnode, nextSibling) {
      vnode.dom = $doc.createTextNode(vnode.children)
      insertNode(parent, vnode.dom, nextSibling)
    }
    var possibleParents = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}
    function createHTML(parent, vnode, ns, nextSibling) {
      var match = vnode.children.match(/^\s*?<(\w+)/im) || []
      // not using the proper parent makes the child element(s) vanish.
      //     var div = document.createElement("div")
      //     div.innerHTML = "<td>i</td><td>j</td>"
      //     console.log(div.innerHTML)
      // --> "ij", no <td> in sight.
      var temp = $doc.createElement(possibleParents[match[1]] || "div")
      if (ns === "http://www.w3.org/2000/svg") {
        temp.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\">" + vnode.children + "</svg>"
        temp = temp.firstChild
      } else {
        temp.innerHTML = vnode.children
      }
      vnode.dom = temp.firstChild
      vnode.domSize = temp.childNodes.length
      // Capture nodes to remove, so we don't confuse them.
      vnode.instance = []
      var fragment = $doc.createDocumentFragment()
      var child
      while (child = temp.firstChild) {
        vnode.instance.push(child)
        fragment.appendChild(child)
      }
      insertNode(parent, fragment, nextSibling)
    }
    function createFragment(parent, vnode, hooks, ns, nextSibling) {
      var fragment = $doc.createDocumentFragment()
      if (vnode.children != null) {
        var children = vnode.children
        createNodes(fragment, children, 0, children.length, hooks, null, ns)
      }
      vnode.dom = fragment.firstChild
      vnode.domSize = fragment.childNodes.length
      insertNode(parent, fragment, nextSibling)
    }
    function createElement(parent, vnode, hooks, ns, nextSibling) {
      var tag = vnode.tag
      var attrs = vnode.attrs
      var is = attrs && attrs.is
  
      ns = getNameSpace(vnode) || ns
  
      var element = ns ?
        is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
        is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag)
      vnode.dom = element
  
      if (attrs != null) {
        setAttrs(vnode, attrs, ns)
      }
  
      insertNode(parent, element, nextSibling)
  
      if (!maybeSetContentEditable(vnode)) {
        if (vnode.children != null) {
          var children = vnode.children
          createNodes(element, children, 0, children.length, hooks, null, ns)
          if (vnode.tag === "select" && attrs != null) setLateSelectAttrs(vnode, attrs)
        }
      }
    }
    function initComponent(vnode, hooks) {
      var sentinel
      if (typeof vnode.tag.view === "function") {
        vnode.state = Object.create(vnode.tag)
        sentinel = vnode.state.view
        if (sentinel.$$reentrantLock$$ != null) return
        sentinel.$$reentrantLock$$ = true
      } else {
        vnode.state = void 0
        sentinel = vnode.tag
        if (sentinel.$$reentrantLock$$ != null) return
        sentinel.$$reentrantLock$$ = true
        vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode)
      }
      initLifecycle(vnode.state, vnode, hooks)
      if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
      vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
      if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
      sentinel.$$reentrantLock$$ = null
    }
    function createComponent(parent, vnode, hooks, ns, nextSibling) {
      initComponent(vnode, hooks)
      if (vnode.instance != null) {
        createNode(parent, vnode.instance, hooks, ns, nextSibling)
        vnode.dom = vnode.instance.dom
        vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0
      }
      else {
        vnode.domSize = 0
      }
    }
  
    //update
    /**
     * @param {Element|Fragment} parent - the parent element
     * @param {Vnode[] | null} old - the list of vnodes of the last `render()` call for
     *                               this part of the tree
     * @param {Vnode[] | null} vnodes - as above, but for the current `render()` call.
     * @param {Function[]} hooks - an accumulator of post-render hooks (oncreate/onupdate)
     * @param {Element | null} nextSibling - the next DOM node if we're dealing with a
     *                                       fragment that is not the last item in its
     *                                       parent
     * @param {'svg' | 'math' | String | null} ns) - the current XML namespace, if any
     * @returns void
     */
    // This function diffs and patches lists of vnodes, both keyed and unkeyed.
    //
    // We will:
    //
    // 1. describe its general structure
    // 2. focus on the diff algorithm optimizations
    // 3. discuss DOM node operations.
  
    // ## Overview:
    //
    // The updateNodes() function:
    // - deals with trivial cases
    // - determines whether the lists are keyed or unkeyed based on the first non-null node
    //   of each list.
    // - diffs them and patches the DOM if needed (that's the brunt of the code)
    // - manages the leftovers: after diffing, are there:
    //   - old nodes left to remove?
    // 	 - new nodes to insert?
    // 	 deal with them!
    //
    // The lists are only iterated over once, with an exception for the nodes in `old` that
    // are visited in the fourth part of the diff and in the `removeNodes` loop.
  
    // ## Diffing
    //
    // Reading https://github.com/localvoid/ivi/blob/ddc09d06abaef45248e6133f7040d00d3c6be853/packages/ivi/src/vdom/implementation.ts#L617-L837
    // may be good for context on longest increasing subsequence-based logic for moving nodes.
    //
    // In order to diff keyed lists, one has to
    //
    // 1) match nodes in both lists, per key, and update them accordingly
    // 2) create the nodes present in the new list, but absent in the old one
    // 3) remove the nodes present in the old list, but absent in the new one
    // 4) figure out what nodes in 1) to move in order to minimize the DOM operations.
    //
    // To achieve 1) one can create a dictionary of keys => index (for the old list), then iterate
    // over the new list and for each new vnode, find the corresponding vnode in the old list using
    // the map.
    // 2) is achieved in the same step: if a new node has no corresponding entry in the map, it is new
    // and must be created.
    // For the removals, we actually remove the nodes that have been updated from the old list.
    // The nodes that remain in that list after 1) and 2) have been performed can be safely removed.
    // The fourth step is a bit more complex and relies on the longest increasing subsequence (LIS)
    // algorithm.
    //
    // the longest increasing subsequence is the list of nodes that can remain in place. Imagine going
    // from `1,2,3,4,5` to `4,5,1,2,3` where the numbers are not necessarily the keys, but the indices
    // corresponding to the keyed nodes in the old list (keyed nodes `e,d,c,b,a` => `b,a,e,d,c` would
    //  match the above lists, for example).
    //
    // In there are two increasing subsequences: `4,5` and `1,2,3`, the latter being the longest. We
    // can update those nodes without moving them, and only call `insertNode` on `4` and `5`.
    //
    // @localvoid adapted the algo to also support node deletions and insertions (the `lis` is actually
    // the longest increasing subsequence *of old nodes still present in the new list*).
    //
    // It is a general algorithm that is fireproof in all circumstances, but it requires the allocation
    // and the construction of a `key => oldIndex` map, and three arrays (one with `newIndex => oldIndex`,
    // the `LIS` and a temporary one to create the LIS).
    //
    // So we cheat where we can: if the tails of the lists are identical, they are guaranteed to be part of
    // the LIS and can be updated without moving them.
    //
    // If two nodes are swapped, they are guaranteed not to be part of the LIS, and must be moved (with
    // the exception of the last node if the list is fully reversed).
    //
    // ## Finding the next sibling.
    //
    // `updateNode()` and `createNode()` expect a nextSibling parameter to perform DOM operations.
    // When the list is being traversed top-down, at any index, the DOM nodes up to the previous
    // vnode reflect the content of the new list, whereas the rest of the DOM nodes reflect the old
    // list. The next sibling must be looked for in the old list using `getNextSibling(... oldStart + 1 ...)`.
    //
    // In the other scenarios (swaps, upwards traversal, map-based diff),
    // the new vnodes list is traversed upwards. The DOM nodes at the bottom of the list reflect the
    // bottom part of the new vnodes list, and we can use the `v.dom`  value of the previous node
    // as the next sibling (cached in the `nextSibling` variable).
  
  
    // ## DOM node moves
    //
    // In most scenarios `updateNode()` and `createNode()` perform the DOM operations. However,
    // this is not the case if the node moved (second and fourth part of the diff algo). We move
    // the old DOM nodes before updateNode runs because it enables us to use the cached `nextSibling`
    // variable rather than fetching it using `getNextSibling()`.
    //
    // The fourth part of the diff currently inserts nodes unconditionally, leading to issues
    // like #1791 and #1999. We need to be smarter about those situations where adjascent old
    // nodes remain together in the new list in a way that isn't covered by parts one and
    // three of the diff algo.
  
    function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
      if (old === vnodes || old == null && vnodes == null) return
      else if (old == null || old.length === 0) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
      else if (vnodes == null || vnodes.length === 0) removeNodes(parent, old, 0, old.length)
      else {
        var isOldKeyed = old[0] != null && old[0].key != null
        var isKeyed = vnodes[0] != null && vnodes[0].key != null
        var start = 0, oldStart = 0
        if (!isOldKeyed) while (oldStart < old.length && old[oldStart] == null) oldStart++
        if (!isKeyed) while (start < vnodes.length && vnodes[start] == null) start++
        if (isOldKeyed !== isKeyed) {
          removeNodes(parent, old, oldStart, old.length)
          createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
        } else if (!isKeyed) {
          // Don't index past the end of either list (causes deopts).
          var commonLength = old.length < vnodes.length ? old.length : vnodes.length
          // Rewind if necessary to the first non-null index on either side.
          // We could alternatively either explicitly create or remove nodes when `start !== oldStart`
          // but that would be optimizing for sparse lists which are more rare than dense ones.
          start = start < oldStart ? start : oldStart
          for (; start < commonLength; start++) {
            o = old[start]
            v = vnodes[start]
            if (o === v || o == null && v == null) continue
            else if (o == null) createNode(parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling))
            else if (v == null) removeNode(parent, o)
            else updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns)
          }
          if (old.length > commonLength) removeNodes(parent, old, start, old.length)
          if (vnodes.length > commonLength) createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
        } else {
          // keyed diff
          var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling
  
          // bottom-up
          while (oldEnd >= oldStart && end >= start) {
            oe = old[oldEnd]
            ve = vnodes[end]
            if (oe.key !== ve.key) break
            if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
            if (ve.dom != null) nextSibling = ve.dom
            oldEnd--, end--
          }
          // top-down
          while (oldEnd >= oldStart && end >= start) {
            o = old[oldStart]
            v = vnodes[start]
            if (o.key !== v.key) break
            oldStart++, start++
            if (o !== v) updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns)
          }
          // swaps and list reversals
          while (oldEnd >= oldStart && end >= start) {
            if (start === end) break
            if (o.key !== ve.key || oe.key !== v.key) break
            topSibling = getNextSibling(old, oldStart, nextSibling)
            moveNodes(parent, oe, topSibling)
            if (oe !== v) updateNode(parent, oe, v, hooks, topSibling, ns)
            if (++start <= --end) moveNodes(parent, o, nextSibling)
            if (o !== ve) updateNode(parent, o, ve, hooks, nextSibling, ns)
            if (ve.dom != null) nextSibling = ve.dom
            oldStart++; oldEnd--
            oe = old[oldEnd]
            ve = vnodes[end]
            o = old[oldStart]
            v = vnodes[start]
          }
          // bottom up once again
          while (oldEnd >= oldStart && end >= start) {
            if (oe.key !== ve.key) break
            if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
            if (ve.dom != null) nextSibling = ve.dom
            oldEnd--, end--
            oe = old[oldEnd]
            ve = vnodes[end]
          }
          if (start > end) removeNodes(parent, old, oldStart, oldEnd + 1)
          else if (oldStart > oldEnd) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
          else {
            // inspired by ivi https://github.com/ivijs/ivi/ by Boris Kaul
            var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li=0, i=0, pos = 2147483647, matched = 0, map, lisIndices
            for (i = 0; i < vnodesLength; i++) oldIndices[i] = -1
            for (i = end; i >= start; i--) {
              if (map == null) map = getKeyMap(old, oldStart, oldEnd + 1)
              ve = vnodes[i]
              var oldIndex = map[ve.key]
              if (oldIndex != null) {
                pos = (oldIndex < pos) ? oldIndex : -1 // becomes -1 if nodes were re-ordered
                oldIndices[i-start] = oldIndex
                oe = old[oldIndex]
                old[oldIndex] = null
                if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
                if (ve.dom != null) nextSibling = ve.dom
                matched++
              }
            }
            nextSibling = originalNextSibling
            if (matched !== oldEnd - oldStart + 1) removeNodes(parent, old, oldStart, oldEnd + 1)
            if (matched === 0) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
            else {
              if (pos === -1) {
                // the indices of the indices of the items that are part of the
                // longest increasing subsequence in the oldIndices list
                lisIndices = makeLisIndices(oldIndices)
                li = lisIndices.length - 1
                for (i = end; i >= start; i--) {
                  v = vnodes[i]
                  if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
                  else {
                    if (lisIndices[li] === i - start) li--
                    else moveNodes(parent, v, nextSibling)
                  }
                  if (v.dom != null) nextSibling = vnodes[i].dom
                }
              } else {
                for (i = end; i >= start; i--) {
                  v = vnodes[i]
                  if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
                  if (v.dom != null) nextSibling = vnodes[i].dom
                }
              }
            }
          }
        }
      }
    }
    function updateNode(parent, old, vnode, hooks, nextSibling, ns) {
      var oldTag = old.tag, tag = vnode.tag
      if (oldTag === tag) {
        vnode.state = old.state
        vnode.events = old.events
        if (shouldNotUpdate(vnode, old)) return
        if (typeof oldTag === "string") {
          if (vnode.attrs != null) {
            updateLifecycle(vnode.attrs, vnode, hooks)
          }
          switch (oldTag) {
            case "#": updateText(old, vnode); break
            case "<": updateHTML(parent, old, vnode, ns, nextSibling); break
            case "[": updateFragment(parent, old, vnode, hooks, nextSibling, ns); break
            default: updateElement(old, vnode, hooks, ns)
          }
        }
        else updateComponent(parent, old, vnode, hooks, nextSibling, ns)
      }
      else {
        removeNode(parent, old)
        createNode(parent, vnode, hooks, ns, nextSibling)
      }
    }
    function updateText(old, vnode) {
      if (old.children.toString() !== vnode.children.toString()) {
        old.dom.nodeValue = vnode.children
      }
      vnode.dom = old.dom
    }
    function updateHTML(parent, old, vnode, ns, nextSibling) {
      if (old.children !== vnode.children) {
        removeHTML(parent, old)
        createHTML(parent, vnode, ns, nextSibling)
      }
      else {
        vnode.dom = old.dom
        vnode.domSize = old.domSize
        vnode.instance = old.instance
      }
    }
    function updateFragment(parent, old, vnode, hooks, nextSibling, ns) {
      updateNodes(parent, old.children, vnode.children, hooks, nextSibling, ns)
      var domSize = 0, children = vnode.children
      vnode.dom = null
      if (children != null) {
        for (var i = 0; i < children.length; i++) {
          var child = children[i]
          if (child != null && child.dom != null) {
            if (vnode.dom == null) vnode.dom = child.dom
            domSize += child.domSize || 1
          }
        }
        if (domSize !== 1) vnode.domSize = domSize
      }
    }
    function updateElement(old, vnode, hooks, ns) {
      var element = vnode.dom = old.dom
      ns = getNameSpace(vnode) || ns
  
      if (vnode.tag === "textarea") {
        if (vnode.attrs == null) vnode.attrs = {}
      }
      updateAttrs(vnode, old.attrs, vnode.attrs, ns)
      if (!maybeSetContentEditable(vnode)) {
        updateNodes(element, old.children, vnode.children, hooks, null, ns)
      }
    }
    function updateComponent(parent, old, vnode, hooks, nextSibling, ns) {
      vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
      if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
      updateLifecycle(vnode.state, vnode, hooks)
      if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks)
      if (vnode.instance != null) {
        if (old.instance == null) createNode(parent, vnode.instance, hooks, ns, nextSibling)
        else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, ns)
        vnode.dom = vnode.instance.dom
        vnode.domSize = vnode.instance.domSize
      }
      else if (old.instance != null) {
        removeNode(parent, old.instance)
        vnode.dom = undefined
        vnode.domSize = 0
      }
      else {
        vnode.dom = old.dom
        vnode.domSize = old.domSize
      }
    }
    function getKeyMap(vnodes, start, end) {
      var map = Object.create(null)
      for (; start < end; start++) {
        var vnode = vnodes[start]
        if (vnode != null) {
          var key = vnode.key
          if (key != null) map[key] = start
        }
      }
      return map
    }
    // Lifted from ivi https://github.com/ivijs/ivi/
    // takes a list of unique numbers (-1 is special and can
    // occur multiple times) and returns an array with the indices
    // of the items that are part of the longest increasing
    // subsequence
    var lisTemp = []
    function makeLisIndices(a) {
      var result = [0]
      var u = 0, v = 0, i = 0
      var il = lisTemp.length = a.length
      for (var i = 0; i < il; i++) lisTemp[i] = a[i]
      for (var i = 0; i < il; ++i) {
        if (a[i] === -1) continue
        var j = result[result.length - 1]
        if (a[j] < a[i]) {
          lisTemp[i] = j
          result.push(i)
          continue
        }
        u = 0
        v = result.length - 1
        while (u < v) {
          // Fast integer average without overflow.
          // eslint-disable-next-line no-bitwise
          var c = (u >>> 1) + (v >>> 1) + (u & v & 1)
          if (a[result[c]] < a[i]) {
            u = c + 1
          }
          else {
            v = c
          }
        }
        if (a[i] < a[result[u]]) {
          if (u > 0) lisTemp[i] = result[u - 1]
          result[u] = i
        }
      }
      u = result.length
      v = result[u - 1]
      while (u-- > 0) {
        result[u] = v
        v = lisTemp[v]
      }
      lisTemp.length = 0
      return result
    }
  
    function getNextSibling(vnodes, i, nextSibling) {
      for (; i < vnodes.length; i++) {
        if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
      }
      return nextSibling
    }
  
    // This covers a really specific edge case:
    // - Parent node is keyed and contains child
    // - Child is removed, returns unresolved promise in `onbeforeremove`
    // - Parent node is moved in keyed diff
    // - Remaining children still need moved appropriately
    //
    // Ideally, I'd track removed nodes as well, but that introduces a lot more
    // complexity and I'm not exactly interested in doing that.
    function moveNodes(parent, vnode, nextSibling) {
      var frag = $doc.createDocumentFragment()
      moveChildToFrag(parent, frag, vnode)
      insertNode(parent, frag, nextSibling)
    }
    function moveChildToFrag(parent, frag, vnode) {
      // Dodge the recursion overhead in a few of the most common cases.
      while (vnode.dom != null && vnode.dom.parentNode === parent) {
        if (typeof vnode.tag !== "string") {
          vnode = vnode.instance
          if (vnode != null) continue
        } else if (vnode.tag === "<") {
          for (var i = 0; i < vnode.instance.length; i++) {
            frag.appendChild(vnode.instance[i])
          }
        } else if (vnode.tag !== "[") {
          // Don't recurse for text nodes *or* elements, just fragments
          frag.appendChild(vnode.dom)
        } else if (vnode.children.length === 1) {
          vnode = vnode.children[0]
          if (vnode != null) continue
        } else {
          for (var i = 0; i < vnode.children.length; i++) {
            var child = vnode.children[i]
            if (child != null) moveChildToFrag(parent, frag, child)
          }
        }
        break
      }
    }
  
    function insertNode(parent, dom, nextSibling) {
      if (nextSibling != null) parent.insertBefore(dom, nextSibling)
      else parent.appendChild(dom)
    }
  
    function maybeSetContentEditable(vnode) {
      if (vnode.attrs == null || (
        vnode.attrs.contenteditable == null && // attribute
        vnode.attrs.contentEditable == null // property
      )) return false
      var children = vnode.children
      if (children != null && children.length === 1 && children[0].tag === "<") {
        var content = children[0].children
        if (vnode.dom.innerHTML !== content) vnode.dom.innerHTML = content
      }
      else if (children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted.")
      return true
    }
  
    //remove
    function removeNodes(parent, vnodes, start, end) {
      for (var i = start; i < end; i++) {
        var vnode = vnodes[i]
        if (vnode != null) removeNode(parent, vnode)
      }
    }
    function removeNode(parent, vnode) {
      var mask = 0
      var original = vnode.state
      var stateResult, attrsResult
      if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeremove === "function") {
        var result = callHook.call(vnode.state.onbeforeremove, vnode)
        if (result != null && typeof result.then === "function") {
          mask = 1
          stateResult = result
        }
      }
      if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") {
        var result = callHook.call(vnode.attrs.onbeforeremove, vnode)
        if (result != null && typeof result.then === "function") {
          // eslint-disable-next-line no-bitwise
          mask |= 2
          attrsResult = result
        }
      }
      checkState(vnode, original)
  
      // If we can, try to fast-path it and avoid all the overhead of awaiting
      if (!mask) {
        onremove(vnode)
        removeChild(parent, vnode)
      } else {
        if (stateResult != null) {
          var next = function () {
            // eslint-disable-next-line no-bitwise
            if (mask & 1) { mask &= 2; if (!mask) reallyRemove() }
          }
          stateResult.then(next, next)
        }
        if (attrsResult != null) {
          var next = function () {
            // eslint-disable-next-line no-bitwise
            if (mask & 2) { mask &= 1; if (!mask) reallyRemove() }
          }
          attrsResult.then(next, next)
        }
      }
  
      function reallyRemove() {
        checkState(vnode, original)
        onremove(vnode)
        removeChild(parent, vnode)
      }
    }
    function removeHTML(parent, vnode) {
      for (var i = 0; i < vnode.instance.length; i++) {
        parent.removeChild(vnode.instance[i])
      }
    }
    function removeChild(parent, vnode) {
      // Dodge the recursion overhead in a few of the most common cases.
      while (vnode.dom != null && vnode.dom.parentNode === parent) {
        if (typeof vnode.tag !== "string") {
          vnode = vnode.instance
          if (vnode != null) continue
        } else if (vnode.tag === "<") {
          removeHTML(parent, vnode)
        } else {
          if (vnode.tag !== "[") {
            parent.removeChild(vnode.dom)
            if (!Array.isArray(vnode.children)) break
          }
          if (vnode.children.length === 1) {
            vnode = vnode.children[0]
            if (vnode != null) continue
          } else {
            for (var i = 0; i < vnode.children.length; i++) {
              var child = vnode.children[i]
              if (child != null) removeChild(parent, child)
            }
          }
        }
        break
      }
    }
    function onremove(vnode) {
      if (typeof vnode.tag !== "string" && typeof vnode.state.onremove === "function") callHook.call(vnode.state.onremove, vnode)
      if (vnode.attrs && typeof vnode.attrs.onremove === "function") callHook.call(vnode.attrs.onremove, vnode)
      if (typeof vnode.tag !== "string") {
        if (vnode.instance != null) onremove(vnode.instance)
      } else {
        var children = vnode.children
        if (Array.isArray(children)) {
          for (var i = 0; i < children.length; i++) {
            var child = children[i]
            if (child != null) onremove(child)
          }
        }
      }
    }
  
    //attrs
    function setAttrs(vnode, attrs, ns) {
      // If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
      //
      // Also, the DOM does things to inputs based on the value, so it needs set first.
      // See: https://github.com/MithrilJS/mithril.js/issues/2622
      if (vnode.tag === "input" && attrs.type != null) vnode.dom.setAttribute("type", attrs.type)
      var isFileInput = attrs != null && vnode.tag === "input" && attrs.type === "file"
      for (var key in attrs) {
        setAttr(vnode, key, null, attrs[key], ns, isFileInput)
      }
    }
    function setAttr(vnode, key, old, value, ns, isFileInput) {
      if (key === "key" || key === "is" || value == null || isLifecycleMethod(key) || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || key === "type" && vnode.tag === "input") return
      if (key[0] === "o" && key[1] === "n") return updateEvent(vnode, key, value)
      if (key.slice(0, 6) === "xlink:") vnode.dom.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value)
      else if (key === "style") updateStyle(vnode.dom, old, value)
      else if (hasPropertyKey(vnode, key, ns)) {
        if (key === "value") {
          // Only do the coercion if we're actually going to check the value.
          /* eslint-disable no-implicit-coercion */
          //setting input[value] to same value by typing on focused element moves cursor to end in Chrome
          //setting input[type=file][value] to same value causes an error to be generated if it's non-empty
          if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === "" + value && (isFileInput || vnode.dom === activeElement())) return
          //setting select[value] to same value while having select open blinks select dropdown in Chrome
          if (vnode.tag === "select" && old !== null && vnode.dom.value === "" + value) return
          //setting option[value] to same value while having select open blinks select dropdown in Chrome
          if (vnode.tag === "option" && old !== null && vnode.dom.value === "" + value) return
          //setting input[type=file][value] to different value is an error if it's non-empty
          // Not ideal, but it at least works around the most common source of uncaught exceptions for now.
          if (isFileInput && "" + value !== "") { console.error("`value` is read-only on file inputs!"); return }
          /* eslint-enable no-implicit-coercion */
        }
        vnode.dom[key] = value
      } else {
        if (typeof value === "boolean") {
          if (value) vnode.dom.setAttribute(key, "")
          else vnode.dom.removeAttribute(key)
        }
        else vnode.dom.setAttribute(key === "className" ? "class" : key, value)
      }
    }
    function removeAttr(vnode, key, old, ns) {
      if (key === "key" || key === "is" || old == null || isLifecycleMethod(key)) return
      if (key[0] === "o" && key[1] === "n") updateEvent(vnode, key, undefined)
      else if (key === "style") updateStyle(vnode.dom, old, null)
      else if (
        hasPropertyKey(vnode, key, ns)
        && key !== "className"
        && key !== "title" // creates "null" as title
        && !(key === "value" && (
          vnode.tag === "option"
          || vnode.tag === "select" && vnode.dom.selectedIndex === -1 && vnode.dom === activeElement()
        ))
        && !(vnode.tag === "input" && key === "type")
      ) {
        vnode.dom[key] = null
      } else {
        var nsLastIndex = key.indexOf(":")
        if (nsLastIndex !== -1) key = key.slice(nsLastIndex + 1)
        if (old !== false) vnode.dom.removeAttribute(key === "className" ? "class" : key)
      }
    }
    function setLateSelectAttrs(vnode, attrs) {
      if ("value" in attrs) {
        if(attrs.value === null) {
          if (vnode.dom.selectedIndex !== -1) vnode.dom.value = null
        } else {
          var normalized = "" + attrs.value // eslint-disable-line no-implicit-coercion
          if (vnode.dom.value !== normalized || vnode.dom.selectedIndex === -1) {
            vnode.dom.value = normalized
          }
        }
      }
      if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined)
    }
    function updateAttrs(vnode, old, attrs, ns) {
      if (old && old === attrs) {
        console.warn("Don't reuse attrs object, use new object for every redraw, this will throw in next major")
      }
      if (attrs != null) {
        // If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
        //
        // Also, the DOM does things to inputs based on the value, so it needs set first.
        // See: https://github.com/MithrilJS/mithril.js/issues/2622
        if (vnode.tag === "input" && attrs.type != null) vnode.dom.setAttribute("type", attrs.type)
        var isFileInput = vnode.tag === "input" && attrs.type === "file"
        for (var key in attrs) {
          setAttr(vnode, key, old && old[key], attrs[key], ns, isFileInput)
        }
      }
      var val
      if (old != null) {
        for (var key in old) {
          if (((val = old[key]) != null) && (attrs == null || attrs[key] == null)) {
            removeAttr(vnode, key, val, ns)
          }
        }
      }
    }
    function isFormAttribute(vnode, attr) {
      return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === activeElement() || vnode.tag === "option" && vnode.dom.parentNode === $doc.activeElement
    }
    function isLifecycleMethod(attr) {
      return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
    }
    function hasPropertyKey(vnode, key, ns) {
      // Filter out namespaced keys
      return ns === undefined && (
        // If it's a custom element, just keep it.
        vnode.tag.indexOf("-") > -1 || vnode.attrs != null && vnode.attrs.is ||
        // If it's a normal element, let's try to avoid a few browser bugs.
        key !== "href" && key !== "list" && key !== "form" && key !== "width" && key !== "height"// && key !== "type"
        // Defer the property check until *after* we check everything.
      ) && key in vnode.dom
    }
  
    //style
    var uppercaseRegex = /[A-Z]/g
    function toLowerCase(capital) { return "-" + capital.toLowerCase() }
    function normalizeKey(key) {
      return key[0] === "-" && key[1] === "-" ? key :
        key === "cssFloat" ? "float" :
          key.replace(uppercaseRegex, toLowerCase)
    }
    function updateStyle(element, old, style) {
      if (old === style) {
        // Styles are equivalent, do nothing.
      } else if (style == null) {
        // New style is missing, just clear it.
        element.style.cssText = ""
      } else if (typeof style !== "object") {
        // New style is a string, let engine deal with patching.
        element.style.cssText = style
      } else if (old == null || typeof old !== "object") {
        // `old` is missing or a string, `style` is an object.
        element.style.cssText = ""
        // Add new style properties
        for (var key in style) {
          var value = style[key]
          if (value != null) element.style.setProperty(normalizeKey(key), String(value))
        }
      } else {
        // Both old & new are (different) objects.
        // Update style properties that have changed
        for (var key in style) {
          var value = style[key]
          if (value != null && (value = String(value)) !== String(old[key])) {
            element.style.setProperty(normalizeKey(key), value)
          }
        }
        // Remove style properties that no longer exist
        for (var key in old) {
          if (old[key] != null && style[key] == null) {
            element.style.removeProperty(normalizeKey(key))
          }
        }
      }
    }
  
    // Here's an explanation of how this works:
    // 1. The event names are always (by design) prefixed by `on`.
    // 2. The EventListener interface accepts either a function or an object
    //    with a `handleEvent` method.
    // 3. The object does not inherit from `Object.prototype`, to avoid
    //    any potential interference with that (e.g. setters).
    // 4. The event name is remapped to the handler before calling it.
    // 5. In function-based event handlers, `ev.target === this`. We replicate
    //    that below.
    // 6. In function-based event handlers, `return false` prevents the default
    //    action and stops event propagation. We replicate that below.
    function EventDict() {
      // Save this, so the current redraw is correctly tracked.
      this._ = currentRedraw
    }
    EventDict.prototype = Object.create(null)
    EventDict.prototype.handleEvent = function (ev) {
      var handler = this["on" + ev.type]
      var result
      if (typeof handler === "function") result = handler.call(ev.currentTarget, ev)
      else if (typeof handler.handleEvent === "function") handler.handleEvent(ev)
      if (this._ && ev.redraw !== false) (0, this._)()
      if (result === false) {
        ev.preventDefault()
        ev.stopPropagation()
      }
    }
  
    //event
    function updateEvent(vnode, key, value) {
      if (vnode.events != null) {
        vnode.events._ = currentRedraw
        if (vnode.events[key] === value) return
        if (value != null && (typeof value === "function" || typeof value === "object")) {
          if (vnode.events[key] == null) vnode.dom.addEventListener(key.slice(2), vnode.events, false)
          vnode.events[key] = value
        } else {
          if (vnode.events[key] != null) vnode.dom.removeEventListener(key.slice(2), vnode.events, false)
          vnode.events[key] = undefined
        }
      } else if (value != null && (typeof value === "function" || typeof value === "object")) {
        vnode.events = new EventDict()
        vnode.dom.addEventListener(key.slice(2), vnode.events, false)
        vnode.events[key] = value
      }
    }
  
    //lifecycle
    function initLifecycle(source, vnode, hooks) {
      if (typeof source.oninit === "function") callHook.call(source.oninit, vnode)
      if (typeof source.oncreate === "function") hooks.push(callHook.bind(source.oncreate, vnode))
    }
    function updateLifecycle(source, vnode, hooks) {
      if (typeof source.onupdate === "function") hooks.push(callHook.bind(source.onupdate, vnode))
    }
    function shouldNotUpdate(vnode, old) {
      do {
        if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") {
          var force = callHook.call(vnode.attrs.onbeforeupdate, vnode, old)
          if (force !== undefined && !force) break
        }
        if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeupdate === "function") {
          var force = callHook.call(vnode.state.onbeforeupdate, vnode, old)
          if (force !== undefined && !force) break
        }
        return false
      } while (false); // eslint-disable-line no-constant-condition
      vnode.dom = old.dom
      vnode.domSize = old.domSize
      vnode.instance = old.instance
      // One would think having the actual latest attributes would be ideal,
      // but it doesn't let us properly diff based on our current internal
      // representation. We have to save not only the old DOM info, but also
      // the attributes used to create it, as we diff *that*, not against the
      // DOM directly (with a few exceptions in `setAttr`). And, of course, we
      // need to save the children and text as they are conceptually not
      // unlike special "attributes" internally.
      vnode.attrs = old.attrs
      vnode.children = old.children
      vnode.text = old.text
      return true
    }
  
    var currentDOM
  
    return function(dom, vnodes, redraw) {
      if (!dom) throw new TypeError("DOM element being rendered to does not exist.")
      if (currentDOM != null && dom.contains(currentDOM)) {
        throw new TypeError("Node is currently being rendered to and thus is locked.")
      }
      var prevRedraw = currentRedraw
      var prevDOM = currentDOM
      var hooks = []
      var active = activeElement()
      var namespace = dom.namespaceURI
  
      currentDOM = dom
      currentRedraw = typeof redraw === "function" ? redraw : undefined
      try {
        // First time rendering into a node clears it out
        if (dom.vnodes == null) dom.textContent = ""
        vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes])
        updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace)
        dom.vnodes = vnodes
        // `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
        if (active != null && activeElement() !== active && typeof active.focus === "function") active.focus()
        for (var i = 0; i < hooks.length; i++) hooks[i]()
      } finally {
        currentRedraw = prevRedraw
        currentDOM = prevDOM
      }
    }
  }
  
  },{"../render/vnode":8}],7:[function(require,module,exports){
  "use strict"
  
  var Vnode = require("../render/vnode")
  
  module.exports = function(html) {
    if (html == null) html = ""
    return Vnode("<", undefined, undefined, html, undefined, undefined)
  }
  
  },{"../render/vnode":8}],8:[function(require,module,exports){
  "use strict"
  
  function Vnode(tag, key, attrs, children, text, dom) {
    return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: undefined, events: undefined, instance: undefined}
  }
  Vnode.normalize = function(node) {
    if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
    if (node == null || typeof node === "boolean") return null
    if (typeof node === "object") return node
    return Vnode("#", undefined, undefined, String(node), undefined, undefined)
  }
  Vnode.normalizeChildren = function(input) {
    var children = []
    if (input.length) {
      var isKeyed = input[0] != null && input[0].key != null
      // Note: this is a *very* perf-sensitive check.
      // Fun fact: merging the loop like this is somehow faster than splitting
      // it, noticeably so.
      for (var i = 1; i < input.length; i++) {
        if ((input[i] != null && input[i].key != null) !== isKeyed) {
          throw new TypeError(
            isKeyed && (input[i] != null || typeof input[i] === "boolean")
              ? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m.fragment({key: ...}), instead of a hole."
              : "In fragments, vnodes must either all have keys or none have keys."
          )
        }
      }
      for (var i = 0; i < input.length; i++) {
        children[i] = Vnode.normalize(input[i])
      }
    }
    return children
  }
  
  module.exports = Vnode
  
  },{}],9:[function(require,module,exports){
  // This exists so I'm only saving it once.
  "use strict"
  
  module.exports = {}.hasOwnProperty
  
  },{}],10:[function(require,module,exports){
  (function() {
    var Atom, compareAndSet, deref, multi, reset, resetVals, swap, swapVals, type;
  
    ({multi, type} = require('./util'));
  
    exports.deref = deref = multi(type);
  
    // these default definitions are clearly non-atomic but JS is single-threaded anyway
    exports.resetVals = resetVals = (multi(type)).default((self, value) => {
      return [deref(self), reset(self, value)];
    });
  
    exports.reset = reset = (multi(type)).default((self, value) => {
      return swap(self, () => {
        return value;
      });
    });
  
    exports.swapVals = swapVals = (multi(type)).default((self, f, ...args) => {
      return resetVals(self, f(deref(self), ...args));
    });
  
    exports.swap = swap = (multi(type)).default((...args) => {
      return (swapVals(...args))[1];
    });
  
    exports.compareAndSet = compareAndSet = multi(type).default((self, oldval, newval) => {
      return (oldval === deref(self)) && (reset(self, newval), true);
    });
  
    Atom = function(x1) {
      this.x = x1;
    };
  
    deref.when(Atom, (self) => {
      return self.x;
    });
  
    reset.when(Atom, (self, value) => {
      return self.x = value;
    });
  
    exports.atom = (x) => {
      return new Atom(x);
    };
  
  }).call(this);
  
  },{"./util":14}],11:[function(require,module,exports){
  (function() {
    var jsx, r;
  
    r = require('./reagent');
  
    jsx = (tag, {children = [], ...attrs}, key) => { // this API isn't documented properly...
      return r.with({key, ...attrs}, [tag].concat(children));
    };
  
    module.exports = {
      jsx,
      jsxs: jsx,
      Fragment: '<>'
    };
  
  }).call(this);
  
  },{"./reagent":13}],12:[function(require,module,exports){
  (function() {
  
    /*
      Context structure:
      {:coeffects {:event [:some-id :some-param]
                   :db    "original contents of app-db"}
       :effects   {:db    "new value for app-db>"
                   :dispatch  [:an-event-id :param1]}
       :queue     "a collection of further interceptors"
       :stack     "a collection of interceptors already walked"}
    */
    var _calcSignals, _calcSub, _clear, _ctxEvt, _cursors, _deref, _dispatch, _duplicate, _effects, _eq_, _eventQueue, _fx, _getDb, _getX, _initReagent, _intercept, _invalidSignals, _noHandler, _pathKey, _replaceEvent, _restoreEvent, _signals, _subscriptionCache, appDb, assoc, assocCoeffect, assocEffect, assocIn, atom, chain, chunks, clearEvent, coeffects, cursor, deref, dict, dispatch, dispatchSync, dissoc, effects, entries, eq, eqShallow, events, flatten, getCoeffect, getEffect, getIn, identical, identity, isArray, isDict, isFn, keys, merge, ratom, regEventCtx, regEventFx, repr, reset, subscribe, subscriptions, swap, toInterceptor, update,
      splice = [].splice;
  
    ({identical, eq, eqShallow, keys, dict, entries, isArray, isDict, isFn, getIn, merge, assoc, assocIn, dissoc, update, repr, identity, chunks, flatten, chain} = require('./util'));
  
    ({atom, deref, reset, swap} = require('./atom'));
  
    ({
      _init: _initReagent,
      atom: ratom,
      cursor
    } = require('./reagent'));
  
    _eq_ = eq;
  
    exports._init = (opts) => {
      _initReagent(opts);
      _eq_ = (opts != null ? opts.eq : void 0) || _eq_;
      return void 0;
    };
  
    /* Application state atom */
    exports.appDb = appDb = ratom({});
  
    events = atom({});
  
    effects = atom({});
  
    coeffects = atom({});
  
    subscriptions = atom({});
  
    _noHandler = (kind, [key]) => {
      return console.error(`re-frame: no ${kind} handler registered for: '${key}'`);
    };
  
    _duplicate = (kind, key) => {
      return console.warn(`re-frame: overwriting ${kind} handler for: '${key}'`);
    };
  
    _subscriptionCache = new Map();
  
    /* Removes cached subscriptions (forcing to recalculate) */
    exports.clearSubscriptionCache = () => {
      return _subscriptionCache.clear();
    };
  
    _eventQueue = new Set();
  
    /* Cancels all scheduled events */
    exports.purgeEventQueue = () => {
      _eventQueue.forEach(clearTimeout);
      return _eventQueue.clear();
    };
  
    _clear = (atom) => {
      return (id) => {
        if (id) {
          swap(atom, dissoc, id);
        } else {
          reset(atom, {});
        }
        return void 0;
      };
    };
  
    _invalidSignals = () => {
      throw SyntaxError("re-frame: invalid subscription signals");
    };
  
    _signals = (signals) => {
      var queries;
      if (!signals.every(([k, q]) => {
        return (k === '<-') && isArray(q);
      })) {
        _invalidSignals();
      }
      queries = signals.map((kq) => {
        return kq[1];
      });
      if (queries.length === 1) {
        return () => {
          return subscribe(queries[0]);
        };
      } else {
        return () => {
          return queries.map(subscribe);
        };
      }
    };
  
    _deref = (ratom) => {
      return ratom._deref(); // parent ratom is not to be propagated
    };
  
    _calcSignals = (signals) => {
      if (isArray(signals)) {
        return signals.map(_deref);
      } else if (!isDict(signals)) {
        return _deref(signals);
      } else {
        return dict(entries(signals).map(([k, v]) => {
          return [k, _deref(v)];
        }));
      }
    };
  
    /* Registers a subscription function to compute view data */
    exports.regSub = (id, ...signals) => {
      var computation, ref;
      ref = signals, [...signals] = ref, [computation] = splice.call(signals, -1);
      signals = signals.length === 0 ? () => {
        return appDb;
      } : signals.length !== 1 ? _signals(chunks(signals, 2)) : isFn(signals[0]) ? signals[0] : _invalidSignals();
      if ((deref(subscriptions))[id]) {
        _duplicate("subscription", id);
      }
      swap(subscriptions, assoc, id, [signals, computation]);
      return void 0;
    };
  
    _calcSub = (signals, computation) => {
      return (query) => {
        var input, input_, key, output, x;
        input = _calcSignals(signals(query));
        if (_subscriptionCache.has(key = repr(query))) {
          [input_, output] = _subscriptionCache.get(key);
          if (eqShallow(input, input_)) {
            return output;
          }
        }
        x = computation(input, query);
        _subscriptionCache.set(key, [input, x]);
        return x;
      };
    };
  
    _cursors = new Map();
  
    /* Returns an RCursor that derefs to subscription result (or cached value) */
    exports.subscribe = subscribe = (query) => {
      var it, key;
      if (!(it = (deref(subscriptions))[query[0]])) {
        return _noHandler("subscription", query);
      } else {
        if (!_cursors.has(key = repr(query))) {
          _cursors.set(key, cursor(_calcSub(...it), query));
        }
        return _cursors.get(key);
      }
    };
  
    /* Unregisters one or all subscription functions */
    exports.clearSub = ((_clearSubs) => {
      return (id) => {
        id || _cursors.clear();
        return _clearSubs(id);
      };
    })(_clear(subscriptions));
  
    /*
      Produces an interceptor (changed from varargs to options object).
  
      Interceptor structure:
      {:id      :something             ;; decorative only - can be ignored
       :before  (fn [context] ...)     ;; returns a possibly modified `context`
       :after   (fn [context] ...)}    ;; returns a possibly modified `context`
    */
    exports.toInterceptor = toInterceptor = (args) => {
      return {
        id: args != null ? args.id : void 0,
        before: (args != null ? args.before : void 0) || identity,
        after: (args != null ? args.after : void 0) || identity
      };
    };
  
    _getX = (x, key, notFound) => {
      if (!key) {
        return x;
      } else if (key in (x || {})) {
        return x[key];
      } else {
        return notFound;
      }
    };
  
    /* Returns context coeffects or specified coeffect */
    exports.getCoeffect = getCoeffect = (context, key, notFound) => {
      return _getX(context.coeffects, key, notFound);
    };
  
    /* Returns context effects or specified effect */
    exports.getEffect = getEffect = (context, key, notFound) => {
      return _getX(context.effects, key, notFound);
    };
  
    /* Produces a copy of the context with added coeffect */
    exports.assocCoeffect = assocCoeffect = (context, key, value) => {
      return assocIn(context, ['coeffects', key], value);
    };
  
    /* Produces a copy of the context with added effect */
    exports.assocEffect = assocEffect = (context, key, value) => {
      return assocIn(context, ['effects', key], value);
    };
  
    /* Produces a copy of the context with interceptors added to the queue */
    exports.enqueue = (context, interceptors) => {
      return update(context, 'queue', (xs) => {
        return [...xs, ...interceptors];
      });
    };
  
    _getDb = (context) => {
      return getEffect(context, 'db', getCoeffect(context, 'db'));
    };
  
    _pathKey = 're-frame-path/db-store';
  
    /* Produces an interceptor which switches out db for its subpath */
    exports.path = (...path) => {
      return toInterceptor({
        id: 'path',
        before: (context) => {
          var db, dbs;
          db = getCoeffect(context, 'db');
          dbs = [...(context[_pathKey] || []), db];
          return chain(context, [assoc, _pathKey, dbs], [assocCoeffect, 'db', getIn(db, flatten(path))]);
        },
        after: (context) => {
          var db, dbs, ref;
          ref = context[_pathKey], [...dbs] = ref, [db] = splice.call(dbs, -1);
          return chain(context, [assoc, _pathKey, dbs], [assocEffect, 'db', assocIn(db, flatten(path), _getDb(context))], [assocCoeffect, 'db', db]);
        }
      });
    };
  
    /* Produces an interceptor which updates db effect after the event handler */
    exports.enrich = (f) => {
      return toInterceptor({
        id: 'enrich',
        after: (context) => {
          return assocEffect(context, 'db', f(_getDb(context), getCoeffect(context, 'event')));
        }
      });
    };
  
    _replaceEvent = (f) => {
      return (context) => {
        var event;
        event = getCoeffect(context, 'event');
        return chain(context, [assocCoeffect, 'originalEvent', event], [assocCoeffect, 'event', f(event)]);
      };
    };
  
    _restoreEvent = (context) => {
      return assocCoeffect(context, 'event', getCoeffect(context, 'originalEvent'));
    };
  
    /* An interceptor switches out event for its 1st parameter */
    exports.unwrap = toInterceptor({
      id: 'unwrap',
      after: _restoreEvent,
      before: _replaceEvent((event) => {
        return event[1];
      })
    });
  
    /* An interceptor switches out event for its parameters */
    exports.trimV = toInterceptor({
      id: 'trim-v',
      after: _restoreEvent,
      before: _replaceEvent((event) => {
        return event.slice(1);
      })
    });
  
    /* Produces an interceptor which updates runs an action on db/event after the event handler */
    exports.after = (f) => {
      return toInterceptor({
        id: 'after',
        after: (context) => {
          f(_getDb(context), getCoeffect(context, 'event'));
          return context;
        }
      });
    };
  
    /* Produces an interceptor which recalculates db subpath if input subpaths changed */
    exports.onChanges = (f, outPath, ...inPaths) => {
      return toInterceptor({
        id: 'on-changes',
        after: (context) => {
          var db0, db1, ins, outs;
          db0 = getCoeffect(context, 'db');
          db1 = _getDb(context);
          [ins, outs] = [db0, db1].map((db) => {
            return inPaths.map((path) => {
              return getIn(db, path);
            });
          });
          if (outs.every((x, i) => {
            return identical(x, ins[i]);
          })) {
            return context;
          } else {
            return assocEffect(context, 'db', assocIn(db1, outPath, f(...outs)));
          }
        }
      });
    };
  
    /* Registers a coeffect handler (for use as an interceptor) */
    exports.regCofx = (id, handler) => {
      if ((deref(coeffects))[id]) {
        _duplicate("coeffect", id);
      }
      swap(coeffects, assoc, id, handler);
      return void 0;
    };
  
    /* Produces an interceptor which applies a coeffect handler before the event handler */
    exports.injectCofx = (key, arg) => {
      return toInterceptor({
        id: key,
        before: (context) => {
          var it;
          if ((it = (deref(coeffects))[key])) {
            return update(context, 'coeffects', (deref(coeffects))[key], arg);
          } else {
            _noHandler("coeffect", [key]);
            return context;
          }
        }
      });
    };
  
    /* Unregisters one or all coeffect handlers */
    exports.clearCofx = _clear(coeffects);
  
    /* Registers an event handler which calculates new application state from the old one */
    exports.regEventDb = (id, interceptors, handler) => {
      if (!handler) {
        [interceptors, handler] = [[], interceptors];
      }
      return regEventFx(id, interceptors, (cofx, query) => {
        return {
          db: handler(cofx.db, query)
        };
      });
    };
  
    _ctxEvt = (handler) => {
      return (context) => {
        return merge(context, {
          effects: handler(getCoeffect(context), getCoeffect(context, 'event'))
        });
      };
    };
  
    /* Registers an event handler which calculates effects from coeffects */
    exports.regEventFx = regEventFx = (id, interceptors, handler) => {
      if (!handler) {
        [interceptors, handler] = [[], interceptors];
      }
      return regEventCtx(id, interceptors, _ctxEvt(handler));
    };
  
    /* Registers an event handler which arbitrarily updates the context */
    exports.regEventCtx = regEventCtx = (id, interceptors, handler) => {
      if (!handler) {
        [interceptors, handler] = [[], interceptors];
      }
      if ((deref(events))[id]) {
        _duplicate("event", id);
      }
      swap(events, assoc, id, [flatten(interceptors.filter(identity)), handler]);
      return void 0;
    };
  
    /* Unregisters one or all event handlers */
    exports.clearEvent = clearEvent = _clear(events);
  
    _intercept = (context, hook) => { // every step is dynamic so no chains, folds or for-loops
      var x, xs;
      context = merge(context, {
        stack: [],
        queue: context.stack
      });
      while (context.queue.length > 0) {
        [x, ...xs] = context.queue;
        context = x[hook](merge(context, {
          queue: xs
        }));
        context = merge(context, {
          stack: [x, ...context.stack]
        });
      }
      return context;
    };
  
    /* Dispatches an event (running back and forth through interceptor chain & handler then actions effects) */
    exports.dispatchSync = dispatchSync = (event) => {
      var context, handler, it, stack;
      if (!(it = (deref(events))[event[0]])) {
        return _noHandler("event", event);
      } else {
        [stack, handler] = it;
        context = {
          stack,
          coeffects: {
            event,
            db: _deref(appDb)
          }
        };
        return chain(context, [_intercept, 'before'], handler, [_intercept, 'after'], getEffect, entries, _fx);
      }
    };
  
    _dispatch = ({ms, dispatch}) => {
      var id;
      _eventQueue.add(id = setTimeout((() => {
        _eventQueue.delete(id);
        return dispatchSync(dispatch);
      }), ms));
      return id;
    };
  
    /* Schedules dispatching of an event */
    exports.dispatch = dispatch = (dispatch) => {
      return _dispatch({dispatch});
    };
  
    _fx = (fxs, fx = deref(effects)) => {
      return fxs.filter(identity).forEach(([k, v]) => {
        var it;
        if ((it = fx[k] || _effects[k])) {
          return it(v);
        } else {
          return _noHandler("effect", [k]);
        }
      });
    };
  
    _effects = { // builtin effects
      db: (value) => {
        if (!_eq_(value, _deref(appDb))) {
          return reset(appDb, value);
        }
      },
      fx: _fx,
      dispatchLater: _dispatch,
      dispatch: (dispatch) => {
        return _dispatch({dispatch});
      }
    };
  
    /* Registers an effect handler (implementation of a side-effect) */
    exports.regFx = (id, handler) => {
      if ((deref(effects))[id]) {
        _duplicate("effect", id);
      }
      swap(effects, assoc, id, handler);
      return void 0;
    };
  
    /* Unregisters one or all effect handlers (excepting builtin ones) */
    exports.clearFx = _clear(effects);
  
    /* Convenience function (for JS); returns deref'ed result of a subscription */
    exports.dsub = (query) => {
      return deref(subscribe(query));
    };
  
    /* Convenience function (for fx); schedules dispatching an event (if present) with additional parameters */
    exports.disp = (evt, ...args) => {
      return evt && dispatch([...evt, ...args]);
    };
  
  }).call(this);
  
  },{"./atom":10,"./reagent":13,"./util":14}],13:[function(require,module,exports){
  (function() {
    var RAtom, RCursor, _createElement, _cursor, _detectChanges, _eqArgs, _fnElement, _fragment_, _meta, _mithril_, _mount_, _moveParent, _propagate, _quiet, _quietEvents, _redraw_, _renderCache, _rendering, _vnode, _with, argv, asElement, assocIn, atom, children, classNames, deref, eqShallow, getIn, identical, identity, isArray, keys, merge, prepareAttrs, props, ratom, reset, second, stateAtom, swap;
  
    ({identical, eqShallow, isArray, keys, getIn, merge, assocIn, identity} = require('./util'));
  
    ({atom, deref, reset, swap} = require('./atom'));
  
    _mount_ = _redraw_ = _mithril_ = identity;
  
    _fragment_ = second = (a, b) => {
      return b;
    };
  
    exports._init = (opts) => {
      _mithril_ = (opts != null ? opts.hyperscript : void 0) || _mithril_;
      _fragment_ = _mithril_.fragment || second;
      _redraw_ = (opts != null ? opts.redraw : void 0) || _redraw_;
      _mount_ = (opts != null ? opts.mount : void 0) || _mount_;
      return void 0;
    };
  
    _vnode = null; // contains vnode of most recent component
  
    _renderCache = new Map();
  
    /* Reset function components cache. */
    exports.resetCache = () => {
      return _renderCache.clear();
    };
  
    _propagate = (vnode, ratom, value) => {
      while (vnode) {
        vnode.state._subs.set(ratom, value);
        vnode = vnode._parent;
      }
      return value;
    };
  
    _eqArgs = (xs, ys) => {
      return (!xs && !ys) || ((xs != null ? xs.length : void 0) === (ys != null ? ys.length : void 0) && eqShallow(xs._meta, ys._meta) && xs.every((x, i) => {
        return eqShallow(x, ys[i]);
      }));
    };
  
    _detectChanges = function(vnode) {
      var subs;
      return !_eqArgs(vnode.attrs.argv, this._argv) || ((subs = Array.from(this._subs)).some(([ratom, value]) => {
        return ratom._deref() !== value;
      })) || (subs.forEach(([ratom, value]) => {
        return _propagate(vnode._parent, ratom, value);
      }), false); // no changes, propagating ratoms
    };
  
    _rendering = (binding) => {
      return function(vnode) {
        var _old;
        _old = _vnode;
        _vnode = vnode;
        try {
          this._subs.clear();
          this._argv = vnode.attrs.argv; // last render args
          return binding.call(this, vnode);
        } finally {
          _vnode = _old;
        }
      };
    };
  
    _fnElement = (fcomponent) => {
      var component;
      if (!_renderCache.has(fcomponent)) {
        component = {
          oninit: function(vnode) {
            this._comp = component; // self
            this._subs = new Map(); // input ratoms (resets before render)
            this._atom = ratom(); // state ratom;  ._subs should work for it as well
            this._view = fcomponent;
            return void 0;
          },
          onbeforeupdate: _detectChanges,
          view: _rendering(function(vnode) {
            var args, x;
            x = this._view.apply(vnode, (args = vnode.attrs.argv.slice(1)));
            return asElement(typeof x !== 'function' ? x : (this._view = x).apply(vnode, args));
          })
        };
        _renderCache.set(fcomponent, component);
      }
      return _renderCache.get(fcomponent);
    };
  
    _meta = (meta, o) => {
      if (typeof o === 'object' && !isArray(o)) {
        return [merge(o, meta)];
      } else {
        return [meta, asElement(o)];
      }
    };
  
    _moveParent = (vnode) => {
      if (vnode.attrs) {
        vnode._parent = vnode.attrs._parent || null; // might be undefined if not called directly from a component
        delete vnode.attrs._parent;
      }
      return vnode;
    };
  
    /* Converts Hiccup forms into Mithril vnodes */
    exports.asElement = asElement = (form) => {
      var head, meta;
      if (isArray(form)) {
        head = form[0];
        meta = {
          ...(form._meta || {}),
          _parent: _vnode
        };
        if (head === '>') {
          return _createElement(form[1], _meta(meta, form[2]), form.slice(3).map(asElement));
        } else if (head === '<>') {
          return _moveParent(_fragment_(meta, form.slice(1).map(asElement)));
        } else if (typeof head === 'string') {
          return _createElement(head, _meta(meta, form[1]), form.slice(2).map(asElement));
        } else if (typeof head === 'function') {
          return _createElement(_fnElement(head), [
            {
              ...meta,
              argv: form
            }
          ]);
        } else {
          return _createElement(head, [
            {
              ...meta,
              argv: form
            }
          ]);
        }
      } else {
        return form;
      }
    };
  
    /* Mounts a Hiccup form to a DOM element */
    exports.render = (comp, container) => {
      return _mount_(container, {
        view: () => {
          return asElement(comp);
        }
      });
    };
  
    /* Adds metadata to the Hiccup form of a Reagent component or a fragment */
    exports.with = _with = (meta, form) => {
      form = form.slice(0);
      form._meta = meta;
      return form;
    };
  
    /*
      Creates a class component based on the spec. (It's a valid Mithril component.)
      Only a subset of the original reagent functons is supported (mostly based on Mithril hooks):
      constructor, getInitialState, componentDidMount, componentDidUpdate,
      componentWillUnmount, shouldComponentUpdate, render, reagentRender (use symbols in Wisp).
      Also, beforeComponentUnmounts was added (see 'onbeforeremove' in Mithril).
      Instead of 'this', vnode is passed in calls.
      NOTE: shouldComponentUpdate overrides Reagent changes detection
    */
    exports.createClass = (spec) => {
      var bind, component;
      bind = (k, method = spec[k]) => {
        return method && ((vnode, args) => {
          _vnode = vnode;
          try {
            return method.apply(vnode, args || [vnode]);
          } finally {
            _vnode = null;
          }
        });
      };
      return component = {
        oninit: function(vnode) {
          var base, base1;
          this._comp = component;
          this._subs = new Map();
          this._atom = ratom(typeof (base = bind('getInitialState')) === "function" ? base(vnode) : void 0);
          if (typeof (base1 = bind('constructor')) === "function") {
            base1(vnode, [vnode, vnode.attrs]);
          }
          return void 0;
        },
        oncreate: bind('componentDidMount'),
        onupdate: bind('componentDidUpdate'),
        onremove: bind('componentWillUnmount'),
        onbeforeupdate: bind('shouldComponentUpdate') || _detectChanges,
        onbeforeremove: bind('beforeComponentUnmounts'),
        view: _rendering(spec.render || ((render) => {
          return function(vnode) {
            return asElement(render.apply(vnode, vnode.attrs.argv.slice(1)));
          };
        })(spec.reagentRender))
      };
    };
  
    RAtom = function(x1) {
      this.x = x1;
      this._deref = (() => {
        return this.x;
      });
      return void 0; // ._deref doesn't cause propagation
    };
  
    deref.when(RAtom, (self) => {
      return _propagate(_vnode, self, self._deref());
    });
  
    reset.when(RAtom, (self, value) => {
      if (identical(value, self.x)) {
        return value;
      } else {
        self.x = value;
        _redraw_();
        return value;
      }
    });
  
    /* Produces an atom which causes redraws on update */
    exports.atom = ratom = (x) => {
      return new RAtom(x);
    };
  
    RCursor = function(src1, path1) {
      this.src = src1;
      this.path = path1;
      this._deref = (() => {
        return this.src(this.path);
      });
      return void 0;
    };
  
    deref.when(RCursor, (self) => {
      return _propagate(_vnode, self, self._deref());
    });
  
    reset.when(RCursor, (self, value) => {
      if (identical(value, self._deref())) {
        return value;
      } else {
        self.src(self.path, value);
        _redraw_();
        return value;
      }
    });
  
    _cursor = (ratom) => {
      return (path, value) => { // value is optional but undefined would be replaced with fallback value anyway
        if (value === void 0) {
          return getIn(ratom._deref(), path);
        } else {
          return swap(ratom, assocIn, path, value);
        }
      };
    };
  
    /* Produces a cursor (sub-state atom) from a path and either a r.atom or a getter/setter function */
    exports.cursor = (src, path) => {
      return new RCursor((typeof src === 'function' ? src : _cursor(src)), path);
    };
  
    /* Converts a Mithril component into a Reagent component */
    exports.adaptComponent = (c) => {
      return (...args) => {
        return _with(_vnode != null ? _vnode.attrs : void 0, ['>', c, ...args]);
      };
    };
  
    /* Merges provided class definitions into a string (definitions can be strings, lists or dicts) */
    exports.classNames = classNames = (...classes) => {
      var cls;
      cls = classes.reduce(((o, x) => {
        if (typeof x !== 'object') {
          x = `${x}`.split(' ');
        }
        return merge(o, (!isArray(x) ? x : merge(...x.map((k) => {
          return k && {
            [k]: k
          };
        }))));
      }), {});
      return (keys(cls)).filter((k) => {
        return cls[k];
      }).join(' ');
    };
  
    _quiet = (handler) => {
      if (typeof handler !== 'function') {
        return handler;
      } else {
        return function(event) {
          event.redraw = false;
          return handler.call(this, event);
        };
      }
    };
  
    _quietEvents = (attrs, o = {}) => {
      var k, v;
      for (k in attrs) {
        v = attrs[k];
        (o[k] = k.slice(0, 2) !== 'on' ? v : _quiet(v));
      }
      return o;
    };
  
    prepareAttrs = (tag, props) => {
      if (typeof tag !== 'string') {
        return props;
      } else {
        return ['class', 'className', 'classList'].reduce(((o, k) => {
          o[k] && (o[k] = classNames(o[k]));
          return o;
        }), _quietEvents(props));
      }
    };
  
    _createElement = (type, first, rest) => { // performance optimization
      var _rest, ref, ref1;
      _rest = ((ref = first[1]) != null ? (ref1 = ref.attrs) != null ? ref1.key : void 0 : void 0) != null ? rest : [rest];
      return _moveParent(_mithril_(type, prepareAttrs(type, first[0]), first[1], ..._rest));
    };
  
    /* Invokes Mithril directly to produce a vnode (props are optional if no children are given) */
    exports.createElement = (type, props, ...children) => {
      return _createElement(type, [props || {}], children);
    };
  
    /* Produces the vnode of current (most recent?) component */
    exports.currentComponent = () => {
      return _vnode;
    };
  
    /* Returns children of the Mithril vnode */
    exports.children = children = (vnode) => {
      return vnode.children;
    };
  
    /* Returns props of the Mithril vnode */
    exports.props = props = (vnode) => {
      return vnode.attrs;
    };
  
    /* Produces the Hiccup form of the Reagent component from vnode */
    exports.argv = argv = (vnode) => {
      return vnode.attrs.argv;
    };
  
    /* Returns RAtom containing state of a Reagent component (from vnode) */
    exports.stateAtom = stateAtom = (vnode) => {
      return vnode.state._atom;
    };
  
    /* Returns state of a Reagent component (from vnode) */
    exports.state = (vnode) => {
      return deref(stateAtom(vnode));
    };
  
    /* Replaces state of a Reagent component (from vnode) */
    exports.replaceState = (vnode, newState) => {
      return reset(stateAtom(vnode), newState);
    };
  
    /* Partially updates state of a Reagent component (from vnode) */
    exports.setState = (vnode, newState) => {
      return swap(stateAtom(vnode), merge, newState);
    };
  
  }).call(this);
  
  },{"./atom":10,"./util":14}],14:[function(require,module,exports){
  (function() {
    var _dict, _entries, assoc, assocIn, entries, eq, eqArr, eqObj, eqObjShallow, eqShallow, flatten, getIn, identical, identity, isArray, isDict, keys, merge, replacer, sorter, type, update, vals;
  
    exports.identity = identity = (x) => {
      return x;
    };
  
    exports.type = type = (x) => {
      if (x == null) {
        return x;
      } else {
        return Object.getPrototypeOf(x).constructor;
      }
    };
  
    exports.keys = keys = (x) => {
      return Object.keys(x || {});
    };
  
    exports.vals = vals = (x) => {
      return Object.values(x || {});
    };
  
    _entries = Object.entries || ((o) => {
      return keys(o).map((k) => {
        return [k, o[k]];
      });
    });
  
    exports.entries = entries = (o) => {
      return _entries(o || {});
    };
  
    _dict = Object.fromEntries || ((kvs) => {
      return merge(...kvs.map(([k, v]) => {
        return {
          [k]: v
        };
      }));
    });
  
    exports.dict = (x) => {
      return _dict(x || []);
    };
  
    exports.isArray = isArray = Array.isArray;
  
    exports.isDict = isDict = (x) => {
      return (type(x)) === Object;
    };
  
    exports.isFn = (x) => {
      return (typeof x) === 'function';
    };
  
    exports.merge = merge = (...os) => {
      return Object.assign({}, ...os);
    };
  
    exports.assoc = assoc = (o, k, v) => {
      o = isArray(o) && Number.isInteger(k) && k >= 0 ? o.slice(0) : {...o};
      o[k] = v;
      return o;
    };
  
    exports.dissoc = (o, ...ks) => {
      o = isArray(o) ? o.slice(0) : {...o};
      ks.forEach((k) => {
        return delete o[k];
      });
      return o;
    };
  
    exports.update = update = (o, k, f, ...args) => {
      return assoc(o, k, f(o != null ? o[k] : void 0, ...args));
    };
  
    exports.getIn = getIn = (o, path) => {
      return path.reduce(((x, k) => {
        return x != null ? x[k] : void 0;
      }), o);
    };
  
    exports.assocIn = assocIn = (o, path, v) => {
      if (path.length < 2) {
        return assoc(o, path[0], v);
      } else {
        return update(o, path[0], assocIn, path.slice(1), v);
      }
    };
  
    exports.updateIn = (o, path, f, ...args) => {
      return assocIn(o, path, f(getIn(o, path), ...args));
    };
  
    // dissocIn = (o, path, ...ks) => updateIn o, path, dissoc, ...ks
    exports.chunks = (xs, n) => {
      return Array.from({
        length: Math.ceil(xs.length / n)
      }, (_, i) => {
        return xs.slice(n * i, n * (i + 1));
      });
    };
  
    exports.flatten = flatten = (xs) => {
      if (!isArray(xs)) {
        return xs;
      } else {
        return xs.flatMap(flatten);
      }
    };
  
    exports.repr = (x) => {
      return JSON.stringify(x, replacer);
    };
  
    exports.identical = identical = (a, b) => {
      return a === b || (a !== a && b !== b);
    };
  
    exports.eq = eq = (a, b) => {
      return a === b || (a !== a ? b !== b : isArray(a) ? (isArray(b)) && eqArr(a, b, eq) : (isDict(a)) && (isDict(b)) && eqObj(a, b));
    };
  
    exports.eqShallow = eqShallow = (a, b) => {
      return a === b || (a !== a ? b !== b : isArray(a) ? (isArray(b)) && eqArr(a, b, identical) : (isDict(a)) && (isDict(b)) && eqObjShallow(a, b));
    };
  
    sorter = (o) => {
      return _dict((entries(o)).sort());
    };
  
    replacer = (_, v) => {
      if (type(v) === RegExp) {
        return `${v}`;
      } else if (!isDict(v)) {
        return v;
      } else {
        return sorter(v);
      }
    };
  
    eqArr = (xs, ys, eq) => {
      return xs.length === ys.length && xs.every((x, i) => {
        return eq(x, ys[i]);
      });
    };
  
    eqObj = (a, b, aks = keys(a), bks = new Set(keys(b))) => {
      return aks.length === bks.size && aks.every((k) => {
        return bks.has(k);
      }) && aks.every((k) => {
        return eq(a[k], b[k]);
      });
    };
  
    eqObjShallow = (a, b, aks = keys(a)) => {
      return aks.length === keys(b).length && aks.every((k) => {
        return k in b && identical(a[k], b[k]);
      });
    };
  
    exports.chain = (x, ...fs) => {
      return fs.map((f) => {
        if (isArray(f)) {
          return f;
        } else {
          return [f];
        }
      }).reduce(((x, f) => {
        return f[0](x, ...f.slice(1));
      }), x);
    };
  
    exports.multi = (dispatch = identity) => {
      var _default, _methods, self;
      _methods = new Map();
      _default = () => {
        throw TypeError("Invalid arguments");
      };
      return self = Object.assign(((...args) => {
        return ((_methods.get(dispatch(...args))) || _default)(...args);
      }), {
        when: (k, f) => {
          _methods.set(k, f);
          return self;
        },
        default: (f) => {
          _default = f;
          return self;
        }
      });
    };
  
  }).call(this);
  
  },{}],"mithril/hyperscript":[function(require,module,exports){
  "use strict"
  
  var hyperscript = require("./render/hyperscript")
  
  hyperscript.trust = require("./render/trust")
  hyperscript.fragment = require("./render/fragment")
  
  module.exports = hyperscript
  
  },{"./render/fragment":3,"./render/hyperscript":4,"./render/trust":7}],"mithril/mount":[function(require,module,exports){
  "use strict"
  
  module.exports = require("./mount-redraw").mount
  
  },{"./mount-redraw":2}],"mithril/redraw":[function(require,module,exports){
  "use strict"
  
  module.exports = require("./mount-redraw").redraw
  
  },{"./mount-redraw":2}],"mithril/render":[function(require,module,exports){
  "use strict"
  
  module.exports = require("./render/render")(typeof window !== "undefined" ? window : null)
  
  },{"./render/render":6}],"mreframe/atom":[function(require,module,exports){
  (function() {
    module.exports = require('./src/atom');
  
  }).call(this);
  
  },{"./src/atom":10}],"mreframe/jsx-runtime":[function(require,module,exports){
  (function() {
    module.exports = require('./src/jsx-runtime');
  
  }).call(this);
  
  },{"./src/jsx-runtime":11}],"mreframe/re-frame":[function(require,module,exports){
  (function() {
    var hyperscript, mount, reFrame, redraw;
  
    mount = require('mithril/mount');
  
    redraw = require('mithril/redraw');
  
    hyperscript = require('mithril/hyperscript');
  
    module.exports = reFrame = require('./src/re-frame');
  
    reFrame._init({redraw, hyperscript, mount});
  
  }).call(this);
  
  },{"./src/re-frame":12,"mithril/hyperscript":"mithril/hyperscript","mithril/mount":"mithril/mount","mithril/redraw":"mithril/redraw"}],"mreframe/reagent":[function(require,module,exports){
  (function() {
    var hyperscript, mount, reagent, redraw;
  
    mount = require('mithril/mount');
  
    redraw = require('mithril/redraw');
  
    hyperscript = require('mithril/hyperscript');
  
    module.exports = reagent = require('./src/reagent');
  
    reagent._init({redraw, hyperscript, mount});
  
  }).call(this);
  
  },{"./src/reagent":13,"mithril/hyperscript":"mithril/hyperscript","mithril/mount":"mithril/mount","mithril/redraw":"mithril/redraw"}],"mreframe/util":[function(require,module,exports){
  (function() {
    module.exports = require('./src/util');
  
  }).call(this);
  
  },{"./src/util":14}],"mreframe":[function(require,module,exports){
  (function() {
    var _init, atom, exports, hyperscript, mount, reFrame, reagent, redraw, util;
  
    mount = require('mithril/mount');
  
    redraw = require('mithril/redraw');
  
    hyperscript = require('mithril/hyperscript');
  
    util = require('./util');
  
    atom = require('./atom');
  
    reagent = require('./reagent');
  
    ({_init} = reFrame = require('./re-frame'));
  
    exports = {util, atom, reagent, reFrame, _init};
  
    module.exports = exports; // preventing removal by tree-shaking
  
  }).call(this);
  
  },{"./atom":"mreframe/atom","./re-frame":"mreframe/re-frame","./reagent":"mreframe/reagent","./util":"mreframe/util","mithril/hyperscript":"mithril/hyperscript","mithril/mount":"mithril/mount","mithril/redraw":"mithril/redraw"}]},{},[]);
  ;// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
  // This work is free. You can redistribute it and/or modify it
  // under the terms of the WTFPL, Version 2
  // For more information see LICENSE.txt or http://www.wtfpl.net/
  //
  // For more information, the home page:
  // http://pieroxy.net/blog/pages/lz-string/testing.html
  //
  // LZ-based compression algorithm, version 1.4.5
  var LZString = (function() {
  
  // private property
  var f = String.fromCharCode;
  var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
  var baseReverseDic = {};
  
  function getBaseValue(alphabet, character) {
    if (!baseReverseDic[alphabet]) {
      baseReverseDic[alphabet] = {};
      for (var i=0 ; i<alphabet.length ; i++) {
        baseReverseDic[alphabet][alphabet.charAt(i)] = i;
      }
    }
    return baseReverseDic[alphabet][character];
  }
  
  var LZString = {
    compressToBase64 : function (input) {
      if (input == null) return "";
      var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
      switch (res.length % 4) { // To produce valid Base64
      default: // When could this happen ?
      case 0 : return res;
      case 1 : return res+"===";
      case 2 : return res+"==";
      case 3 : return res+"=";
      }
    },
  
    decompressFromBase64 : function (input) {
      if (input == null) return "";
      if (input == "") return null;
      return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
    },
  
    compressToUTF16 : function (input) {
      if (input == null) return "";
      return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
    },
  
    decompressFromUTF16: function (compressed) {
      if (compressed == null) return "";
      if (compressed == "") return null;
      return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
    },
  
    //compress into uint8array (UCS-2 big endian format)
    compressToUint8Array: function (uncompressed) {
      var compressed = LZString.compress(uncompressed);
      var buf=new Uint8Array(compressed.length*2); // 2 bytes per character
  
      for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
        var current_value = compressed.charCodeAt(i);
        buf[i*2] = current_value >>> 8;
        buf[i*2+1] = current_value % 256;
      }
      return buf;
    },
  
    //decompress from uint8array (UCS-2 big endian format)
    decompressFromUint8Array:function (compressed) {
      if (compressed===null || compressed===undefined){
          return LZString.decompress(compressed);
      } else {
          var buf=new Array(compressed.length/2); // 2 bytes per character
          for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
            buf[i]=compressed[i*2]*256+compressed[i*2+1];
          }
  
          var result = [];
          buf.forEach(function (c) {
            result.push(f(c));
          });
          return LZString.decompress(result.join(''));
  
      }
  
    },
  
  
    //compress into a string that is already URI encoded
    compressToEncodedURIComponent: function (input) {
      if (input == null) return "";
      return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
    },
  
    //decompress from an output of compressToEncodedURIComponent
    decompressFromEncodedURIComponent:function (input) {
      if (input == null) return "";
      if (input == "") return null;
      input = input.replace(/ /g, "+");
      return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
    },
  
    compress: function (uncompressed) {
      return LZString._compress(uncompressed, 16, function(a){return f(a);});
    },
    _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
      if (uncompressed == null) return "";
      var i, value,
          context_dictionary= {},
          context_dictionaryToCreate= {},
          context_c="",
          context_wc="",
          context_w="",
          context_enlargeIn= 2, // Compensate for the first entry which should not count
          context_dictSize= 3,
          context_numBits= 2,
          context_data=[],
          context_data_val=0,
          context_data_position=0,
          ii;
  
      for (ii = 0; ii < uncompressed.length; ii += 1) {
        context_c = uncompressed.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
          context_dictionary[context_c] = context_dictSize++;
          context_dictionaryToCreate[context_c] = true;
        }
  
        context_wc = context_w + context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
          context_w = context_wc;
        } else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
            if (context_w.charCodeAt(0)<256) {
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i=0 ; i<8 ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position ==bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i=0 ; i<16 ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
  
  
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          // Add wc to the dictionary.
          context_dictionary[context_wc] = context_dictSize++;
          context_w = String(context_c);
        }
      }
  
      // Output the code for w.
      if (context_w !== "") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
  
  
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
      }
  
      // Mark the end of the stream
      value = 2;
      for (i=0 ; i<context_numBits ; i++) {
        context_data_val = (context_data_val << 1) | (value&1);
        if (context_data_position == bitsPerChar-1) {
          context_data_position = 0;
          context_data.push(getCharFromInt(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value = value >> 1;
      }
  
      // Flush the last char
      while (true) {
        context_data_val = (context_data_val << 1);
        if (context_data_position == bitsPerChar-1) {
          context_data.push(getCharFromInt(context_data_val));
          break;
        }
        else context_data_position++;
      }
      return context_data.join('');
    },
  
    decompress: function (compressed) {
      if (compressed == null) return "";
      if (compressed == "") return null;
      return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
    },
  
    _decompress: function (length, resetValue, getNextValue) {
      var dictionary = [],
          next,
          enlargeIn = 4,
          dictSize = 4,
          numBits = 3,
          entry = "",
          result = [],
          i,
          w,
          bits, resb, maxpower, power,
          c,
          data = {val:getNextValue(0), position:resetValue, index:1};
  
      for (i = 0; i < 3; i += 1) {
        dictionary[i] = i;
      }
  
      bits = 0;
      maxpower = Math.pow(2,2);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }
  
      switch (next = bits) {
        case 0:
            bits = 0;
            maxpower = Math.pow(2,8);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
          c = f(bits);
          break;
        case 1:
            bits = 0;
            maxpower = Math.pow(2,16);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
          c = f(bits);
          break;
        case 2:
          return "";
      }
      dictionary[3] = c;
      w = c;
      result.push(c);
      while (true) {
        if (data.index > length) {
          return "";
        }
  
        bits = 0;
        maxpower = Math.pow(2,numBits);
        power=1;
        while (power!=maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb>0 ? 1 : 0) * power;
          power <<= 1;
        }
  
        switch (c = bits) {
          case 0:
            bits = 0;
            maxpower = Math.pow(2,8);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
  
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow(2,16);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 2:
            return result.join('');
        }
  
        if (enlargeIn == 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }
  
        if (dictionary[c]) {
          entry = dictionary[c];
        } else {
          if (c === dictSize) {
            entry = w + w.charAt(0);
          } else {
            return null;
          }
        }
        result.push(entry);
  
        // Add w+entry[0] to the dictionary.
        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;
  
        w = entry;
  
        if (enlargeIn == 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }
  
      }
    }
  };
    return LZString;
  })();
  
  if (typeof define === 'function' && define.amd) {
    define(function () { return LZString; });
  } else if( typeof module !== 'undefined' && module != null ) {
    module.exports = LZString
  } else if( typeof angular !== 'undefined' && angular != null ) {
    angular.module('LZString', [])
    .factory('LZString', function () {
      return LZString;
    });
  }
  ;// ==UserScript==
  // @name         Json edit
  // @namespace    https://agregen.gitlab.io/
  // @version      0.0.1
  // @description  JSON editor dialog (intended as a library for userscripts)
  // @author       agreg
  // @license      MIT
  // @match        http://localhost:*
  // @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/prism.min.js
  // @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/components/prism-json.min.js
  // @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/plugins/match-braces/prism-match-braces.min.js
  // ==/UserScript==
  
  var Prism, $jsonEdit = (() => {
    const [TAB, NEWLINE, AMPERSAND, LESS_THAN, NONBREAKING_SPACE] = ['\t', '\n', "&amp;", "&lt;", "&nbsp;"];
    let {isArray} = Array,  isColl = x => x && (typeof x === 'object'); // ignoring non-JSON types
    let spaces = n => Array.from({length: n}, _ => " ").join("");
    let compactItems = (items, {width, indent}) => items.slice(1).reduce((ss, s) => {
      (ss[0].length + 2 + s.length > width ? ss.unshift(s) : (ss[0] += ", " + s));
      return ss;
    }, [items[0]]).reverse().join(`,\n${indent}`);
  
    let pformat = (x, {indent="", width=80, sparse=false, compact=false}={}) => {
      if (!isColl(x))
        return JSON.stringify(x);
      let [bLeft, bRight] = (isArray(x) ? ["[", "]"] : ["{", "}"]);
      let _indent = isArray(x) ? (k => spaces(sparse ? 0 : 1)) : (k => spaces(sparse ? 2 : 3+k.length));
      let kvs = Object.entries(x).map(([k, v]) => [JSON.stringify(!isArray(x) ? k : Number(k)), v]);
      let items = kvs.map(([k, v]) => [k, pformat(v, {width, sparse, compact, indent: indent+_indent(k)})])
                     .map(([k, v]) => (isArray(x) ? v : `${k}: ${v}`));
      let len = indent.length + items.map(s => 2+s.length).reduce((a, b) => a+b, 0);
      let flat = !items.some(s => s.includes(NEWLINE));
      let _wrap = (s, wrap=s.includes(NEWLINE) && !(isArray(x) && !flat)) => !wrap ? s : `\n${indent}  ${s}\n${indent}`;
      let _compact = (sep, {_sparse=sparse, _indent=indent+" ", _width=width-_indent.length+1}={}) =>
        (_sparse   ? _wrap(_compact(sep, {_sparse: false, _width: _width-2, _indent: (flat ? _indent+" " : indent)})) :
         !compact || !flat ? items.join((sparse && !flat) || (flat && (len <= width)) ? ", " : sep) :
         compactItems(items, {width: _width, indent: _indent}));
      return bLeft + (flat && (items.length < 2) ? items[0] || "" :
                      !sparse                    ? _compact(`,\n ${indent}`) :
                      isArray(x)                 ? _compact(`,\n  ${indent}`) :
                      _wrap(items.join(`,\n  ${indent}`), true)) + bRight;
    };
  
    class ParseError extends Error {
      constructor(msg, {position, ...options}) {super(msg, options);  this.position = Number(position)}
    }
  
    let _humanize = s => JSON.stringify( `${s||""}`.replace(/^[a-z]/, c => c.toUpperCase()) ).slice(1, -1);
    let parseJson = s => {
      try {
        return JSON.parse(s);
      } catch (e) {
        let match, _msg = s => _humanize( `${s||""}`.replaceAll(TAB, "\tab").replaceAll(NEWLINE, "\newline") ); // [sic]
        if (match = e.message.match(/^([^]*) in JSON at position ([0-9]+)$|^(Unexpected end of JSON input)$/)) {
          let [_, msg, pos, altMsg] = match;
          return new ParseError(_msg(msg||altMsg), {cause: e, position: pos||s.length});
        } else if (match = e.message.match(/^JSON\.parse: ([^]*) at line ([0-9]+) column ([0-9]+) of the JSON data$/)) {
          let [_, msg, row, col] = match;
          return new ParseError(_msg(msg), {cause: e, position: Number(col) + (row == 1 ? -1 : s.split('\n').slice(0, row-1).join('\n').length)});
        } else {
          console.warn(e);
          return new ParseError(_msg(e.message), {cause: e, position: 0});
        }
      }
    };
  
    let captureTab = editor => event => {
      if (event.key == "Tab") {
        event.preventDefault();
        let before = editor.value.slice(0, editor.selectionStart);
        let after = editor.value.slice(editor.selectionEnd, editor.value.length);
        let pos = editor.selectionEnd + 1;
        editor.value = before + TAB + after;
        editor.selectionStart = editor.selectionEnd = pos;
        update(editor.value);
      }
    }
  
    let $e = (tag, attrs, ...children) => {
      let e = Object.assign(document.createElement(tag), attrs);
      children.forEach(child => e.append(typeof child != 'string' ? child : document.createTextNode(child)));
      return e;
    };
  
    let theme = selector => `${selector} pre {color:white; background:black}
                             ${selector} .token.string {color:slateblue}
                             ${selector} .token.property {color:orange}
                             ${selector} .token.number {color:green}
                             ${selector} .token:is(.boolean, .null) {color:deeppink}
                             ${selector} .token.operator {color:yellowgreen}
                             ${selector} .token.punctuation {color:grey}
                             ${selector} .token:is(.brace-level-2, .brace-level-6, .brace-level-10) {color:#388}
                             ${selector} .token:is(.brace-level-3, .brace-level-7, .brace-level-11) {color:#838}
                             ${selector} .token:is(.brace-level-4, .brace-level-8, .brace-level-12) {color:#883}`;
  
    let createEditorModal = (id, {maxWidth='90%'}={}) => {
      const ID = '#'+id;
      let style = $e('style', {},
        `${ID} {position:fixed; height:calc(90vh - 2em); top:5vh; width:calc(90vw - 2em);
                max-width:${maxWidth}; left:0; right:0; margin:0 auto; z-index:1000}
         ${ID}, ${ID} .window {display:flex; flex-direction:column}
         ${ID} .title {padding:0 1em; background:lightgrey; font-weight:bold; font-size:larger}
         ${ID} .window {position: relative; padding:1em; padding-top:0; background:grey}
         ${ID} :is(.title, .window > *) {flex:0}   ${ID} :is(.window, .editor) {flex-grow:1}
         ${ID} .editor {position:relative; height:calc(100% - 6em)}
         ${ID} .editor > * {position:absolute; top:0; left:0; width:calc(100% - 6px); height:100%; overflow:auto; margin:0}
         ${ID} .editor :is(textarea, pre) {font-family:monospace; font-size:15pt; line-height:20pt;
                                           border-radius:5px; white-space:pre; hyphens:none}
         ${ID}.text .editor :is(textarea, pre) {white-space:pre-wrap; word-wrap:break-word}
         ${ID} .editor textarea {resize:none; z-index:2; background:transparent; color:transparent; caret-color:white}
         ${ID} .editor pre {z-index:1; margin:0; overflow:auto; padding:3px}
         @-moz-document url-prefix() {${ID} .editor pre {padding:4px}}
  
         ${theme(ID)}
  
         ${ID} :is(.toolbar, .buttons) {margin-top:1em; display:flex; justify-content:space-evenly}
         ${ID} .toolbar input[type=number] {width:4em; background:white}
         ${ID} .error {color:yellow; font-weight:bold; font-family:monospace}`);
      setTimeout(() => document.head.append(style));
  
      let modal, title, error, editor, overlay, content, toolbar, sparse, compact, width, redraw, cancel, ok;
      modal = $e('div', {id, className: 'modal', style: "display:none", mode: 'json'},
                 title = $e('div', {className: 'title'}, ""),
                 $e('div', {className: 'window'},
                    $e('div', {className: 'error', innerHTML: "&ZeroWidthSpace;"}, error = $e('span')),
                    $e('div', {className: 'editor'},
                       editor = $e('textarea'),
                       overlay = $e('pre', {}, content = $e('code', {className: "highlighting language-json match-braces"}))),
                    toolbar = $e('div', {className: 'toolbar'},
                                 $e('label', {title: "Don't inline dicts"},
                                    sparse = $e('input', {type: 'checkbox', className: 'sparse'}),
                                    " Sparse"),
                                 $e('label', {title: "Compact long lists"},
                                    compact = $e('input', {type: 'checkbox', className: 'compact'}),
                                    " Compact"),
                                 $e('label', {title: "Width limit (0 = unlimited)"},
                                    "Width ",
                                    width = $e('input', {type: 'number', className: 'width', value: 100, min: 0})),
                                 redraw = $e('button', {className: 'redraw'}, "Check / Reformat")),
                    $e('div', {className: 'buttons'},
                       cancel = $e('button', {className: 'cancel'}, "Cancel"),
                       ok     = $e('button', {className: 'ok'},     "OK"))));
  
      let _isValid, _width = Number(width.value)||Infinity;
  
      let render = (e, text, mode=modal.mode) => {
        e.innerHTML = text.replace(/&/g, AMPERSAND).replace(/</g, LESS_THAN); // can't use innerText here
        (mode === 'json') && Prism && Prism.highlightElement(e);
      };
  
      let update = text => render(content, text + (text.slice(-1) != NEWLINE ? "" : " "));
      let syncScroll = () => {[overlay.scrollTop, overlay.scrollLeft] = [editor.scrollTop, editor.scrollLeft]};
  
      let detectWidth = () => {
        let style = "font-family:monospace; font-size:15pt; line-height:20pt; position:fixed; top:0; left:0";
        let e = $e('span', {style, innerHTML: NONBREAKING_SPACE});
        modal.append(e);
        width.value = _width = Math.floor(editor.clientWidth / e.clientWidth);
        e.remove();
      };
  
      let reformat = (s = editor.value,  o = parseJson(s)) => {
        if (o instanceof Error) {
          error.innerText = o.message || "Syntax error";
          console.warn(o, {position: o.position});
          editor.focus();
          editor.selectionStart = editor.selectionEnd = o.position||0;
        } else {
          error.innerText = "";
          editor.value = pformat(o, {sparse: sparse.checked, compact: compact.checked, width: _width});
          editor.selectionStart = editor.selectionEnd = 0;
          update(editor.value);
          syncScroll();
        }
      };
  
      let _visible = () => modal.style.display !== 'none';
      let toggle = (visible=!_visible()) => {modal.style.display = (visible ? '' : 'none')};
      let _resolve, [editJson, editText] = ['json', 'text'].map(mode => (value=editor.value, options={}) => new Promise(resolve => {
        [modal.mode, _resolve, _isValid] = [mode, resolve, options.validator];
        toolbar.style.display = (mode == 'json' ? '' : 'none');
        modal.classList[mode == 'json' ? 'remove' : 'add']('text');
        [error.innerText, editor.value, title.innerText] = ["", value, options.title||`Enter ${mode}`];
        render(content, value);
        toggle(true);
        detectWidth();
        editor.focus();
      }));
      let editAsJson = (value, options={}) => (setTimeout(reformat), editJson(JSON.stringify(value), options));
      let resolve = (value=editor.value) => (toggle(false), _resolve && _resolve(value));
  
      document.addEventListener('keydown', ({key}) => (key == 'Escape') && toggle(false));
      cancel.onclick = () => toggle();
      ok.onclick = () => {
        if (modal.mode != 'json') resolve(); else {
          let s = editor.value,  o = parseJson(s);
          if (!(o instanceof Error))
            resolve(o)
          else {
            try {if (_isValid(s)) return resolve()} catch (e) {}
            reformat(s, o)
          }
        }
      };
  
      editor.oninput = () => {update(editor.value);  syncScroll()};
      editor.onscroll = syncScroll;
      editor.onkeydown = captureTab(editor);
      redraw.onclick = sparse.onchange = compact.onchange = () => reformat();
      width.onchange = () => {
        if (!width.value || !Number.isInteger( Number(width.value) ))
          alert(`Invalid width value: ${width.value}`);
        else {
          _width = Number(width.value)||Infinity;
          reformat();
        }
      };
  
      return Object.assign(modal, {toggle, editText, editJson, editAsJson, render});
    };
  
    return {pformat, ParseError, parseJson, theme, createEditorModal};
  })();
  ;var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(o){var n=/(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i,t=0,e={},j={manual:o.Prism&&o.Prism.manual,disableWorkerMessageHandler:o.Prism&&o.Prism.disableWorkerMessageHandler,util:{encode:function e(t){return t instanceof C?new C(t.type,e(t.content),t.alias):Array.isArray(t)?t.map(e):t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function n(e,a){var r,t;switch(a=a||{},j.util.type(e)){case"Object":if(t=j.util.objId(e),a[t])return a[t];for(var s in r={},a[t]=r,e)e.hasOwnProperty(s)&&(r[s]=n(e[s],a));return r;case"Array":return(t=j.util.objId(e),a[t])?a[t]:(r=[],a[t]=r,e.forEach(function(e,t){r[t]=n(e,a)}),r);default:return e}},getLanguage:function(e){for(;e;){var t=n.exec(e.className);if(t)return t[1].toLowerCase();e=e.parentElement}return"none"},setLanguage:function(e,t){e.className=e.className.replace(RegExp(n,"gi"),""),e.classList.add("language-"+t)},currentScript:function(){if("undefined"==typeof document)return null;if("currentScript"in document)return document.currentScript;try{throw new Error}catch(e){var t=(/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(e.stack)||[])[1];if(t){var n,a=document.getElementsByTagName("script");for(n in a)if(a[n].src==t)return a[n]}return null}},isActive:function(e,t,n){for(var a="no-"+t;e;){var r=e.classList;if(r.contains(t))return!0;if(r.contains(a))return!1;e=e.parentElement}return!!n}},languages:{plain:e,plaintext:e,text:e,txt:e,extend:function(e,t){var n,a=j.util.clone(j.languages[e]);for(n in t)a[n]=t[n];return a},insertBefore:function(n,e,t,a){var r,s=(a=a||j.languages)[n],i={};for(r in s)if(s.hasOwnProperty(r)){if(r==e)for(var l in t)t.hasOwnProperty(l)&&(i[l]=t[l]);t.hasOwnProperty(r)||(i[r]=s[r])}var o=a[n];return a[n]=i,j.languages.DFS(j.languages,function(e,t){t===o&&e!=n&&(this[e]=i)}),i},DFS:function e(t,n,a,r){r=r||{};var s,i,l,o=j.util.objId;for(s in t)t.hasOwnProperty(s)&&(n.call(t,s,t[s],a||s),i=t[s],"Object"!==(l=j.util.type(i))||r[o(i)]?"Array"!==l||r[o(i)]||(r[o(i)]=!0,e(i,n,s,r)):(r[o(i)]=!0,e(i,n,null,r)))}},plugins:{},highlightAll:function(e,t){j.highlightAllUnder(document,e,t)},highlightAllUnder:function(e,t,n){var a={callback:n,container:e,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};j.hooks.run("before-highlightall",a),a.elements=Array.prototype.slice.apply(a.container.querySelectorAll(a.selector)),j.hooks.run("before-all-elements-highlight",a);for(var r,s=0;r=a.elements[s++];)j.highlightElement(r,!0===t,a.callback)},highlightElement:function(e,t,n){var a=j.util.getLanguage(e),r=j.languages[a];j.util.setLanguage(e,a);var s=e.parentElement;s&&"pre"===s.nodeName.toLowerCase()&&j.util.setLanguage(s,a);var i={element:e,language:a,grammar:r,code:e.textContent};function l(e){i.highlightedCode=e,j.hooks.run("before-insert",i),i.element.innerHTML=i.highlightedCode,j.hooks.run("after-highlight",i),j.hooks.run("complete",i),n&&n.call(i.element)}if(j.hooks.run("before-sanity-check",i),(s=i.element.parentElement)&&"pre"===s.nodeName.toLowerCase()&&!s.hasAttribute("tabindex")&&s.setAttribute("tabindex","0"),!i.code)return j.hooks.run("complete",i),void(n&&n.call(i.element));j.hooks.run("before-highlight",i),i.grammar?t&&o.Worker?((t=new Worker(j.filename)).onmessage=function(e){l(e.data)},t.postMessage(JSON.stringify({language:i.language,code:i.code,immediateClose:!0}))):l(j.highlight(i.code,i.grammar,i.language)):l(j.util.encode(i.code))},highlight:function(e,t,n){n={code:e,grammar:t,language:n};if(j.hooks.run("before-tokenize",n),!n.grammar)throw new Error('The language "'+n.language+'" has no grammar.');return n.tokens=j.tokenize(n.code,n.grammar),j.hooks.run("after-tokenize",n),C.stringify(j.util.encode(n.tokens),n.language)},tokenize:function(e,t){var n=t.rest;if(n){for(var a in n)t[a]=n[a];delete t.rest}var r=new s;return z(r,r.head,e),function e(t,n,a,r,s,i){for(var l in a)if(a.hasOwnProperty(l)&&a[l]){var o=a[l];o=Array.isArray(o)?o:[o];for(var u=0;u<o.length;++u){if(i&&i.cause==l+","+u)return;var g,c=o[u],d=c.inside,p=!!c.lookbehind,m=!!c.greedy,h=c.alias;m&&!c.pattern.global&&(g=c.pattern.toString().match(/[imsuy]*$/)[0],c.pattern=RegExp(c.pattern.source,g+"g"));for(var f=c.pattern||c,b=r.next,y=s;b!==n.tail&&!(i&&y>=i.reach);y+=b.value.length,b=b.next){var v=b.value;if(n.length>t.length)return;if(!(v instanceof C)){var F,x=1;if(m){if(!(F=L(f,y,t,p))||F.index>=t.length)break;var k=F.index,w=F.index+F[0].length,A=y;for(A+=b.value.length;A<=k;)b=b.next,A+=b.value.length;if(A-=b.value.length,y=A,b.value instanceof C)continue;for(var P=b;P!==n.tail&&(A<w||"string"==typeof P.value);P=P.next)x++,A+=P.value.length;x--,v=t.slice(y,A),F.index-=y}else if(!(F=L(f,0,v,p)))continue;var k=F.index,$=F[0],S=v.slice(0,k),E=v.slice(k+$.length),_=y+v.length;i&&_>i.reach&&(i.reach=_);v=b.prev;S&&(v=z(n,v,S),y+=S.length),O(n,v,x);$=new C(l,d?j.tokenize($,d):$,h,$);b=z(n,v,$),E&&z(n,b,E),1<x&&(_={cause:l+","+u,reach:_},e(t,n,a,b.prev,y,_),i&&_.reach>i.reach&&(i.reach=_.reach))}}}}}(e,r,t,r.head,0),function(e){var t=[],n=e.head.next;for(;n!==e.tail;)t.push(n.value),n=n.next;return t}(r)},hooks:{all:{},add:function(e,t){var n=j.hooks.all;n[e]=n[e]||[],n[e].push(t)},run:function(e,t){var n=j.hooks.all[e];if(n&&n.length)for(var a,r=0;a=n[r++];)a(t)}},Token:C};function C(e,t,n,a){this.type=e,this.content=t,this.alias=n,this.length=0|(a||"").length}function L(e,t,n,a){e.lastIndex=t;n=e.exec(n);return n&&a&&n[1]&&(a=n[1].length,n.index+=a,n[0]=n[0].slice(a)),n}function s(){var e={value:null,prev:null,next:null},t={value:null,prev:e,next:null};e.next=t,this.head=e,this.tail=t,this.length=0}function z(e,t,n){var a=t.next,n={value:n,prev:t,next:a};return t.next=n,a.prev=n,e.length++,n}function O(e,t,n){for(var a=t.next,r=0;r<n&&a!==e.tail;r++)a=a.next;(t.next=a).prev=t,e.length-=r}if(o.Prism=j,C.stringify=function t(e,n){if("string"==typeof e)return e;if(Array.isArray(e)){var a="";return e.forEach(function(e){a+=t(e,n)}),a}var r={type:e.type,content:t(e.content,n),tag:"span",classes:["token",e.type],attributes:{},language:n},e=e.alias;e&&(Array.isArray(e)?Array.prototype.push.apply(r.classes,e):r.classes.push(e)),j.hooks.run("wrap",r);var s,i="";for(s in r.attributes)i+=" "+s+'="'+(r.attributes[s]||"").replace(/"/g,"&quot;")+'"';return"<"+r.tag+' class="'+r.classes.join(" ")+'"'+i+">"+r.content+"</"+r.tag+">"},!o.document)return o.addEventListener&&(j.disableWorkerMessageHandler||o.addEventListener("message",function(e){var t=JSON.parse(e.data),n=t.language,e=t.code,t=t.immediateClose;o.postMessage(j.highlight(e,j.languages[n],n)),t&&o.close()},!1)),j;var a=j.util.currentScript();function r(){j.manual||j.highlightAll()}return a&&(j.filename=a.src,a.hasAttribute("data-manual")&&(j.manual=!0)),j.manual||("loading"===(e=document.readyState)||"interactive"===e&&a&&a.defer?document.addEventListener("DOMContentLoaded",r):window.requestAnimationFrame?window.requestAnimationFrame(r):window.setTimeout(r,16)),j}(_self);"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism),Prism.languages.markup={comment:{pattern:/<!--(?:(?!<!--)[\s\S])*?-->/,greedy:!0},prolog:{pattern:/<\?[\s\S]+?\?>/,greedy:!0},doctype:{pattern:/<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(^[^\[]*\[)[\s\S]+(?=\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|'[^']*'/,greedy:!0},punctuation:/^<!|>$|[[\]]/,"doctype-tag":/^DOCTYPE/i,name:/[^\s<>'"]+/}},cdata:{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,greedy:!0},tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"special-attr":[],"attr-value":{pattern:/=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|'/]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:[{pattern:/&[\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\da-f]{1,8};/i]},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.languages.markup.doctype.inside["internal-subset"].inside=Prism.languages.markup,Prism.hooks.add("wrap",function(e){"entity"===e.type&&(e.attributes.title=e.content.replace(/&amp;/,"&"))}),Object.defineProperty(Prism.languages.markup.tag,"addInlined",{value:function(e,t){var n={};n["language-"+t]={pattern:/(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,lookbehind:!0,inside:Prism.languages[t]},n.cdata=/^<!\[CDATA\[|\]\]>$/i;n={"included-cdata":{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,inside:n}};n["language-"+t]={pattern:/[\s\S]+/,inside:Prism.languages[t]};t={};t[e]={pattern:RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g,function(){return e}),"i"),lookbehind:!0,greedy:!0,inside:n},Prism.languages.insertBefore("markup","cdata",t)}}),Object.defineProperty(Prism.languages.markup.tag,"addAttribute",{value:function(e,t){Prism.languages.markup.tag.inside["special-attr"].push({pattern:RegExp(/(^|["'\s])/.source+"(?:"+e+")"+/\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,"i"),lookbehind:!0,inside:{"attr-name":/^[^\s=]+/,"attr-value":{pattern:/=[\s\S]+/,inside:{value:{pattern:/(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,lookbehind:!0,alias:[t,"language-"+t],inside:Prism.languages[t]},punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|'/]}}}})}}),Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup,Prism.languages.xml=Prism.languages.extend("markup",{}),Prism.languages.ssml=Prism.languages.xml,Prism.languages.atom=Prism.languages.xml,Prism.languages.rss=Prism.languages.xml,function(e){var t=/(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;e.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:/@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,inside:{rule:/^@[\w-]+/,"selector-function-argument":{pattern:/(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,lookbehind:!0,alias:"selector"},keyword:{pattern:/(^|[^\w-])(?:and|not|only|or)(?![\w-])/,lookbehind:!0}}},url:{pattern:RegExp("\\burl\\((?:"+t.source+"|"+/(?:[^\\\r\n()"']|\\[\s\S])*/.source+")\\)","i"),greedy:!0,inside:{function:/^url/i,punctuation:/^\(|\)$/,string:{pattern:RegExp("^"+t.source+"$"),alias:"url"}}},selector:{pattern:RegExp("(^|[{}\\s])[^{}\\s](?:[^{};\"'\\s]|\\s+(?![\\s{])|"+t.source+")*(?=\\s*\\{)"),lookbehind:!0},string:{pattern:t,greedy:!0},property:{pattern:/(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,lookbehind:!0},important:/!important\b/i,function:{pattern:/(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,lookbehind:!0},punctuation:/[(){};:,]/},e.languages.css.atrule.inside.rest=e.languages.css;e=e.languages.markup;e&&(e.tag.addInlined("style","css"),e.tag.addAttribute("style","css"))}(Prism),Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0,greedy:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,boolean:/\b(?:false|true)\b/,function:/\b\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,punctuation:/[{}[\];(),.:]/},Prism.languages.javascript=Prism.languages.extend("clike",{"class-name":[Prism.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,lookbehind:!0}],keyword:[{pattern:/((?:^|\})\s*)catch\b/,lookbehind:!0},{pattern:/(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:!0}],function:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,number:{pattern:RegExp(/(^|[^\w$])/.source+"(?:"+/NaN|Infinity/.source+"|"+/0[bB][01]+(?:_[01]+)*n?/.source+"|"+/0[oO][0-7]+(?:_[0-7]+)*n?/.source+"|"+/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source+"|"+/\d+(?:_\d+)*n/.source+"|"+/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source+")"+/(?![\w$])/.source),lookbehind:!0},operator:/--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/}),Prism.languages.javascript["class-name"][0].pattern=/(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/,Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,lookbehind:!0,greedy:!0,inside:{"regex-source":{pattern:/^(\/)[\s\S]+(?=\/[a-z]*$)/,lookbehind:!0,alias:"language-regex",inside:Prism.languages.regex},"regex-delimiter":/^\/|\/$/,"regex-flags":/^[a-z]+$/}},"function-variable":{pattern:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,lookbehind:!0,inside:Prism.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/}),Prism.languages.insertBefore("javascript","string",{hashbang:{pattern:/^#!.*/,greedy:!0,alias:"comment"},"template-string":{pattern:/`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\s\S]+/}},"string-property":{pattern:/((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,lookbehind:!0,greedy:!0,alias:"property"}}),Prism.languages.insertBefore("javascript","operator",{"literal-property":{pattern:/((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,lookbehind:!0,alias:"property"}}),Prism.languages.markup&&(Prism.languages.markup.tag.addInlined("script","javascript"),Prism.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,"javascript")),Prism.languages.js=Prism.languages.javascript,function(){var o,u,g,c,e;void 0!==Prism&&"undefined"!=typeof document&&(Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector),o={js:"javascript",py:"python",rb:"ruby",ps1:"powershell",psm1:"powershell",sh:"bash",bat:"batch",h:"c",tex:"latex"},c="pre[data-src]:not(["+(u="data-src-status")+'="loaded"]):not(['+u+'="'+(g="loading")+'"])',Prism.hooks.add("before-highlightall",function(e){e.selector+=", "+c}),Prism.hooks.add("before-sanity-check",function(e){var r,t,n,a,s,i,l=e.element;l.matches(c)&&(e.code="",l.setAttribute(u,g),(r=l.appendChild(document.createElement("CODE"))).textContent="Loading…",n=l.getAttribute("data-src"),"none"===(e=e.language)&&(t=(/\.(\w+)$/.exec(n)||[,"none"])[1],e=o[t]||t),Prism.util.setLanguage(r,e),Prism.util.setLanguage(l,e),(t=Prism.plugins.autoloader)&&t.loadLanguages(e),n=n,a=function(e){l.setAttribute(u,"loaded");var t,n,a=function(e){if(n=/^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(e||"")){var t=Number(n[1]),e=n[2],n=n[3];return e?n?[t,Number(n)]:[t,void 0]:[t,t]}}(l.getAttribute("data-range"));a&&(t=e.split(/\r\n?|\n/g),n=a[0],a=null==a[1]?t.length:a[1],n<0&&(n+=t.length),n=Math.max(0,Math.min(n-1,t.length)),a<0&&(a+=t.length),a=Math.max(0,Math.min(a,t.length)),e=t.slice(n,a).join("\n"),l.hasAttribute("data-start")||l.setAttribute("data-start",String(n+1))),r.textContent=e,Prism.highlightElement(r)},s=function(e){l.setAttribute(u,"failed"),r.textContent=e},(i=new XMLHttpRequest).open("GET",n,!0),i.onreadystatechange=function(){4==i.readyState&&(i.status<400&&i.responseText?a(i.responseText):400<=i.status?s("✖ Error "+i.status+" while fetching file: "+i.statusText):s("✖ Error: File does not exist or is empty"))},i.send(null))}),e=!(Prism.plugins.fileHighlight={highlight:function(e){for(var t,n=(e||document).querySelectorAll(c),a=0;t=n[a++];)Prism.highlightElement(t)}}),Prism.fileHighlight=function(){e||(console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead."),e=!0),Prism.plugins.fileHighlight.highlight.apply(this,arguments)})}();
  ;Prism.languages.json={property:{pattern:/(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,lookbehind:!0,greedy:!0},string:{pattern:/(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,lookbehind:!0,greedy:!0},comment:{pattern:/\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,greedy:!0},number:/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,punctuation:/[{}[\],]/,operator:/:/,boolean:/\b(?:false|true)\b/,null:{pattern:/\bnull\b/,alias:"keyword"}},Prism.languages.webmanifest=Prism.languages.json;
  ;!function(){if("undefined"!=typeof Prism&&"undefined"!=typeof document){var d={"(":")","[":"]","{":"}"},u={"(":"brace-round","[":"brace-square","{":"brace-curly"},f={"${":"{"},h=0,n=/^(pair-\d+-)(close|open)$/;Prism.hooks.add("complete",function(e){var t=e.element,n=t.parentElement;if(n&&"PRE"==n.tagName){var r=[];if(Prism.util.isActive(t,"match-braces")&&r.push("(","[","{"),0!=r.length){n.__listenerAdded||(n.addEventListener("mousedown",function(){var e=n.querySelector("code"),t=p("brace-selected");Array.prototype.slice.call(e.querySelectorAll("."+t)).forEach(function(e){e.classList.remove(t)})}),Object.defineProperty(n,"__listenerAdded",{value:!0}));var o=Array.prototype.slice.call(t.querySelectorAll("span."+p("token")+"."+p("punctuation"))),l=[];r.forEach(function(e){for(var t=d[e],n=p(u[e]),r=[],c=[],s=0;s<o.length;s++){var i=o[s];if(0==i.childElementCount){var a=i.textContent;(a=f[a]||a)===e?(l.push({index:s,open:!0,element:i}),i.classList.add(n),i.classList.add(p("brace-open")),c.push(s)):a===t&&(l.push({index:s,open:!1,element:i}),i.classList.add(n),i.classList.add(p("brace-close")),c.length&&r.push([s,c.pop()]))}}r.forEach(function(e){var t="pair-"+h+++"-",n=o[e[0]],r=o[e[1]];n.id=t+"open",r.id=t+"close",[n,r].forEach(function(e){e.addEventListener("mouseenter",v),e.addEventListener("mouseleave",m),e.addEventListener("click",b)})})});var c=0;l.sort(function(e,t){return e.index-t.index}),l.forEach(function(e){e.open?(e.element.classList.add(p("brace-level-"+(c%12+1))),c++):(c=Math.max(0,c-1),e.element.classList.add(p("brace-level-"+(c%12+1))))})}}})}function p(e){var t=Prism.plugins.customClass;return t?t.apply(e,"none"):e}function e(e){var t=n.exec(e.id);return document.querySelector("#"+t[1]+("open"==t[2]?"close":"open"))}function v(){Prism.util.isActive(this,"brace-hover",!0)&&[this,e(this)].forEach(function(e){e.classList.add(p("brace-hover"))})}function m(){[this,e(this)].forEach(function(e){e.classList.remove(p("brace-hover"))})}function b(){Prism.util.isActive(this,"brace-select",!0)&&[this,e(this)].forEach(function(e){e.classList.add(p("brace-selected"))})}}();
  ;(()=>{// ==UserScript==
  // @name         IntCyoaEnhancer
  // @namespace    https://agregen.gitlab.io/
  // @version      0.5.2
  // @description  QoL improvements for CYOAs made in IntCyoaCreator
  // @author       agreg
  // @license      MIT
  // @match        https://*.neocities.org/*
  // @match        https://*.github.io/*
  // @icon         https://intcyoacreator.onrender.com/favicon.ico?
  // @run-at       document-start
  // @require      https://unpkg.com/mreframe/dist/mreframe.js
  // @require      https://unpkg.com/lz-string/libs/lz-string.js
  // @require      https://greasyfork.org/scripts/441035-json-edit/code/Json%20edit.js?version=1025094
  // @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/prism.min.js
  // @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/components/prism-json.min.js
  // @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/plugins/match-braces/prism-match-braces.min.js
  // @grant        unsafeWindow
  // @grant        GM_registerMenuCommand
  // @grant        GM_addStyle
  // ==/UserScript==
  
  (function() {
    'use strict';
  
    // overriding AJAX sender (before the page starts loading) to detect project.json download done at init time
    let init, enhance, _XHR = unsafeWindow.XMLHttpRequest;
    unsafeWindow.XMLHttpRequest = class XHR extends _XHR {
      constructor () {
        super();
        let _open = this.open;
        this.open = (...args) => {
          if ((`${args[0]}`.toUpperCase() === "GET") && (`${args[1]}`.match(/^project.json$|^js\/app\.\w*\.js$/))) {
            init(() => this.addEventListener('loadend', () => setTimeout(enhance)));
            // displaying loading indicator if not present already (as a mod)
            if (!document.getElementById('indicator')) {
              let _indicator = document.createElement('div'),  NBSP = '\xA0';
              _indicator.style = `position: fixed;  top: 0;  left: 0;  z-index: 1000`;
              _indicator.title = args[1];
              document.body.prepend(_indicator);
              this.addEventListener('progress', e => {
                _indicator.innerText = NBSP + "Loading data: " + (!e.total ? `${(e.loaded/1024**2).toFixed(1)} MB` :
                                                                  `${(100 * e.loaded / e.total).toFixed(2)}%`);
              });
              this.addEventListener('loadend', () => {_indicator.innerText = ""});
            }
          }
          return _open.apply(this, args);
        };
      }
    };
  
    init = (thunk=enhance) => {!init.done && (console.log("IntCyoaEnhancer!"),  init.done = true,  thunk())};
    document.addEventListener('readystatechange', () =>
      (document.readyState == 'complete') && ['activated', 'rows', 'pointTypes'].every(k => k in app.__vue__.$store.state.app) && init());
  
    enhance = () => {
      let {isArray} = Array,   isJson = x => (typeof x === 'string') && x.trim().match(/^{.*}$/); // minimal check
      let range = n => Array.from({length: n}, (_, i) => i);
      let times = (n, f) => range(n).forEach(f);
      let _lazy = thunk => {let result, cached = false;  return () => (cached ? result : cached = true, result = thunk())};
      let _try = (thunk, fallback, quiet=false) => {try {return thunk()} catch (e) {quiet||console.error(e);  return fallback}};
      let _prompt = (message, value) => {let s = prompt(message, (typeof value == 'string' ? value : JSON.stringify(value)));
                                         return new Promise(resolve => (s != null) && resolve(s))};
      let _node = (tag, attr, ...children) => {
        let node = Object.assign(document.createElement(tag), attr);
        children.forEach(child => {node.append(isArray(child) ? _node(...child) : document.createTextNode(`${child||""}`))});
        return node;
      };
      let _debounce = (thunk, msec) => function $debounce () {
        clearTimeout($debounce.delay);
        $debounce.delay = setTimeout(() => {
          $debounce.delay = null;
          thunk();
        }, msec);
      };
      let $editor = $jsonEdit.createEditorModal('PROMPT');
      document.body.append($editor);
      GM_addStyle(`#PROMPT button {width:auto; background:darkgray; padding:0 1ex; border-radius:1ex}
                   #PROMPT .editor pre {padding:0 !important}`);
      let validator = s => !s || _decode(s);
      let _edit = (message, value, {json=false}={}) => $editor[json ? 'editAsJson' : 'editText'](value, {title: message, validator});
  
      // title & savestate are stored in URL hash
      let _hash = _try(() => `["${decodeURIComponent( location.hash.slice(1) )}"]`);  // it's a JSON array of 2 strings, without '["' & '"]' parts
      let $save = [],   [$title="", $saved="", $snapshot=""] = _try(() => JSON.parse(_hash), []);
      let _encode = o => LZString.compressToBase64(isJson(o) ? o : JSON.stringify(o)),
          _decode = s => (isJson(s) ? JSON.parse(s) : JSON.parse(LZString.decompressFromBase64(s) || (_ => {throw Error("Invalid input")})()));
      let $updateUrl = ({title=$title, save=$save, snapshot=$snapshot}={}) =>
        {location.hash = JSON.stringify([title, ...(!snapshot ? [$saved=save.join(",")] : ["", snapshot])]).slice(2, -2)};
      // app state accessors
      let $store = () => app.__vue__.$store,   $state = () => $store().state.app;
      let $pointTypes = () => $state().pointTypes,   $rows = () => $state().rows;
      let $items = _lazy(() => [].concat( ...$rows().map(row => row.objects) ));
      let $hiddenActive = _lazy(() => $items().filter(item => item.isSelectableMultiple || item.isImageUpload));
      let $itemsMap = _lazy((m = new Map()) => ($items().forEach(item => m.set(item.id, item)), m)),   $getItem = id => $itemsMap().get(id);
      let _fatKeys = x => ['backgroundImage', 'rowBackgroundImage'].concat(x.isImageUpload ? [] : ['image']);
      let _slim = x => x && (typeof x !== 'object' ? x : isArray(x) ? x.map(_slim) :
                             Object.assign({}, x, ..._fatKeys(x).map(k => ({[k]: void 0})),
                                           ...Object.keys(x).filter(k => typeof x[k] === 'object').map(k => x[k] && ({[k]: _slim(x[k])}))));
      let $slimStateCopy = (state=$state()) => $clone( _slim(state) );
      try {$store()} catch (e) {throw Error("[IntCyoaEnhancer] Can't access app state!", {cause: e})}
  
      // logic taken from IntCyoaCreator as it appears to be hardwired into a UI component
      let _selectedMulti = (item, num) => {  // selecting a multi-value
        let counter = 0, sign = Math.sign(num);
        let _timesCmp = n => (sign < 0 ? item.numMultipleTimesMinus < n : item.numMultipleTimesPluss > n);
        let _useMulti = () => _timesCmp(counter) && (item.multipleUseVariable = counter += sign,  true);
        let _addPoints = () => $pointTypes().filter(points => points.id == item.multipleScoreId).every(points =>
          _timesCmp(points.startingSum) && (item.multipleUseVariable = points.startingSum += sign,  true));
        times(Math.abs(num), _ => {
          if ((item.isMultipleUseVariable ? _useMulti() : _addPoints()))
            item.scores.forEach(score => $pointTypes().filter(points => points.id == score.id)
                                                      .forEach(points => {points.startingSum -= sign * parseInt(score.value)}));
        });
      };
      let _loadSave = save => {  // applying a savestate
        let _isHidden = s => s.includes("/ON#") || s.includes("/IMG#");
        let tokens = save.split(','),  activated = tokens.filter(s => s && !_isHidden(s)),  hidden = tokens.filter(_isHidden);
        let _split = (sep, item, token, fn, [id, arg]=token.split(sep, 2)) => {(id == item.id) && fn(arg)};
        $store().commit({type: 'cleanActivated'});  // hopefully not broken…
        $items().forEach(item => {
          if (item.isSelectableMultiple)
            hidden.forEach(token => _split("/ON#", item, token, num => _selectedMulti(item, parseInt(num))));
          else if (item.isImageUpload)
            hidden.forEach(token => _split("/IMG#", item, token, img => {item.image = img.replaceAll("/CHAR#", ",")}));
        });
        //$store().commit({type: 'addNewActivatedArray', newActivated: activated});  // not all versions have this :-(
        let _activated = new Set(activated),  _isActivated = id => _activated.has(id);
        $state().activated = activated;
        $rows().forEach(row => {  // yes, four-level nested loop is how the app does everything
          row.isEditModeOn = false;
          delete row.allowedChoicesChange;  // bugfix: cleanActivated is supposed to do this… but it doesn't
          row.objects.filter(item => _isActivated(item.id)).forEach(item => {
            item.isActive = true;
            row.currentChoices += 1;
            item.scores.forEach(score => $pointTypes().filter(points => points.id == score.id).forEach(points => {
              if (!score.requireds || (score.requireds.length <= 0) || $store().getters.checkRequireds(score)) {
                score.isActive = true;
                points.startingSum -= parseInt(score.value);
              }
            }));
          });
        });
      };
      // these are used for generating savestate
      let _isActive = item => item && (item.isActive || (item.isImageUpload && item.image) || (item.isSelectableMultiple && (item.multipleUseVariable !== 0)));
      let _activeId = item => (!_isActive(item) ? null : item.id + (item.isImageUpload        ? `/IMG#${item.image.replaceAll(",", "/CHAR#")}` :
                                                                    item.isSelectableMultiple ? `/ON#${item.multipleUseVariable}`              : ""));
      //let _activated = () => $items().map(_activeId).filter(Boolean);  // this is how the app calculates it (selection order seems to be ignored)
  
      let $hiddenActivated = () => $hiddenActive().filter(_isActive).map(item => item.id);  // images and multi-vals are excluded from state
      $store().watch(state => state.app.activated.filter(Boolean).concat( $hiddenActivated() ),  // activated is formed incorrectly and may contain ""
                     ids => {$save = ids.map($getItem).filter(Boolean).map(_activeId),  $updateUrl()});  // compared to the app """optimization""" this is blazing fast
  
      let diff = initial => (current=$slimStateCopy(), cheat=$cheat.data) => {
        let _cheat = (function $slim (o) {
          if (!o || isArray(o) || (typeof o != 'object')) return o;
          let kvs = Object.entries(o).filter(([k, v]) => $slim(v));
          return (kvs.length == 0 ? void 0 : Object.fromEntries(kvs));
        })(cheat);
        return (function $diff (a, b/*, ...path*/) {
          if ((typeof a !== typeof b) || (isArray(a) !== isArray(b)) || (isArray(a) && (a.length !== b.length)))
            return b;
          else if (a && b && (typeof a === 'object')) {
            let res = Object.entries(b).map(([k, v]) => [k, $diff(a[k], v/*, ...path, k*/)]).filter(([k, v]) => v !== void 0);
            if (res.length > 0) return Object.fromEntries(res);
          } else if (a === a ? a !== b : b === b)
            return b;
        })(initial, {_cheat, ...current}) || {};
      };
      let restoreSnapshot = initial => (snapshot=$snapshot) => _try(() => {
        let {reFrame: rf, util: {getIn, assoc, isArray, isDict, keys}} = require('mreframe');
        let {_cheat, ..._state} = (typeof snapshot !== 'string' ? snapshot : _decode(snapshot||"{}"));
        let newState = (function $deepMerge (a, b) {
          return (!isDict(b) ? a : keys(b).reduce((o, k) => ((o[k] = (!isDict(b[k]) ? b[k] : $deepMerge(a[k], b[k]))), o), a));
        })($clone(initial), _state);
        (function $updState (a, x/*, ...path*/) {
          a && (typeof a == 'object') && keys(a).forEach(k => {
            isArray(a[k]) && (x[k] = (!isArray(x[k]) ? a[k] : x[k].slice(0, a[k].length).concat( a[k].slice(x[k].length) )));
            (!(k in x) || (typeof a[k] != 'object') ? x[k] = a[k] : $updState(a[k], x[k]/*, ...path, k*/));
          });
          isDict(x) && keys(x).filter(k => !(k in a) && !_fatKeys(x).includes(k)).forEach(k => {delete x[k]});
        })(newState, $state());
        (_cheat || $cheat.toggle) && ($cheat.toggle || $cheat(), rf.disp(['init-db', $cheat.data = _cheat]));
        $snapshot = _encode({_cheat, ..._state});
        $updateUrl();
        return true;
      }) || alert("State load failed. (Possible reason: invalid state snapshot.)");
  
      // debug functions for console
      let $activated = () => $state().activated,   $clone = x => JSON.parse(JSON.stringify(x));
      let $rowsActive = () => $rows().map(row => [row, row.objects.filter(_isActive)]).filter(([_, items]) => items.length > 0);
      let $dbg = {$store, $state, $pointTypes, $rows, $items, $getItem, $activated, $hiddenActivated, $rowsActive, $clone, $slimStateCopy};
      Object.assign(unsafeWindow, {$dbg}, $dbg);
  
      let _bugfix = () => {
        $rows().forEach(row => {delete row.allowedChoicesChange});  // This is a runtime variable, why is it exported?! It breaks reset!
      };
  
      // init && menu
      _bugfix();
      let _title = document.title,  _initial = $slimStateCopy(),  _restore = restoreSnapshot(_initial),  _diff = diff(_initial);
      Object.assign(unsafeWindow, {$initial: JSON.stringify(_initial).length, $diff: _diff, $encode: _encode, $decode: _decode});
      $title && (document.title = $title);
      ($saved||$snapshot) && confirm("Load state from URL?") && setTimeout(() => !$snapshot ? _loadSave($saved) : _restore($snapshot));
      let _syncSnapshot = _debounce(() => {$snapshot = _encode(_diff()), $updateUrl()}, 1000);
      let $watch = (snapshot=($snapshot ? "" : _encode( _diff() ))) => {
        document.body.classList[snapshot ? 'add' : 'remove']('-FULL-SCAN');
        $snapshot = snapshot;
        $watch.stop = $watch.stop && ($watch.stop(), null);
        snapshot && ($watch.stop = $store().watch(x => x, _syncSnapshot, {deep: true}));
        $updateUrl();
      };
      $snapshot && $watch($snapshot);
      GM_registerMenuCommand("Change webpage title", () =>
        _prompt("Change webpage title (empty to default)", $title||document.title).then(s => {document.title = ($title = s) || _title;  $updateUrl()}));
      GM_registerMenuCommand("Edit state", () => _edit("Edit state (empty to reset)", (!$snapshot ? $saved : _decode($snapshot)), {json: $snapshot})
                                                   .then(!$snapshot ? _loadSave : _restore));
      GM_registerMenuCommand("Toggle full scan mode", () => $watch());
      GM_registerMenuCommand("Download project data", () => Object.assign(document.createElement('a'), {
        download: "project.json", href: `data:application/json,${encodeURIComponent(JSON.stringify($state()) + "\n")}`,
      }).click());
      ($state().backpack.length == 0) && GM_registerMenuCommand("Enable backpack", function $addBackpack(prefix) {
        _prompt([prefix, "How many choices should be displayed in a row? (1-4)"].filter(Boolean).join("\n"), "3").then(num =>
          (!["1", "2", "3", "4"].includes(num) ? setTimeout(() => $addBackpack(`Sorry, ${JSON.stringify(num)} is not a valid column number.`)) :
           ($state().backpack = [{title: "Selected choices", titleText: "", template: "1", isInfoRow: true, isResultRow: true,
                                  objectWidth: `col-md-${{1: 12, 2: 6, 3: 4, 4: 3}[num]}`}])));
      });
  
      let $overview = () => {
        if ($overview.toggle)
          $overview.toggle();
        else {
          const _ID = 'LIST', ID = '#'+_ID, _scroll = (s, bg='#2B2F35', thumb='grey', wk='::-webkit-scrollbar') =>
            `${s} {scrollbar-width:thin; scrollbar-color:${thumb} ${bg}}  ${s}${wk} {width:6px; height:6px; background:${bg}}  ${s}${wk}-thumb {background:${thumb}}`;
          GM_addStyle(`${ID} {position:fixed; top:0; left:0; height:100%; width:100%; background:#0008; z-index:1001}
                       ${ID} img {position:fixed; top:0; max-height:40%; object-fit:contain; background:#000B}
                       ${ID} .-nav .-row-name {cursor:pointer; padding:2px 1ex}  ${ID} .-nav .-row-name:hover {background:var(--gray)}
                       ${ID} .-item-name {font-weight:bold}  ${ID} .-dialog :is(.-row-name, .-item):hover {cursor:help; text-shadow:0 0 10px}
                       ${ID} .-roll :is(input, button) {width:2.5em; color:black; background:var(--light)}
                       ${ID} .-roll button {border-radius:2ex}  ${ID} input[type=number] {text-align:right}  ${ID} input:invalid {background:var(--red)}` +
                       [[" .-roll", "0", "20%", "#0008"], [" .-dialog", "20%", "60%", "var(--dark)"], [" .-nav", "80%", "20%", "#0008"]].map(([k, left, width, bg]) =>
                         `${ID}${k} {position:fixed; top:40%; left:${left}; height:calc(60% - 56px); width:${width}; color:var(--light); background:${bg};
                                     padding:1em; overflow-y:auto}  ${_scroll(ID+k)}`).join("\n"));
          document.body.append($overview.overlay = _node('div', {id: _ID, onclick: $overview}));
          $overview.overlay.append($overview.image = _node('img'));
          $overview.overlay.append($overview.activated = _node('div', {className: '-dialog', title: "Activated items", onclick: e => e.stopPropagation()}));
          $overview.overlay.append($overview.nav = _node('div', {className: '-nav', title: "Navigation (visible rows)", onclick: e => e.stopPropagation()}));
          $overview.overlay.append($overview.roll = _node('div', {className: '-roll', title: "Dice roll", onclick: e => e.stopPropagation()}));
          document.addEventListener('keydown', e => (e.key == 'Escape') && $overview.toggle(true));
          let _points = Object.fromEntries( $pointTypes().map(points => [points.id, `[${points.id}] `+ (points.beforeText || `(${points.name})`)]) );
          let _ptReqOp = {1: ">", 2: "≥", 3: "=", 4: "≤", 5: "<"},  _ptReqCmpOp = {1: ">", 2: "=", 3: "≥"};
          let _req = score => x => (x.required ? "" : "NOT!") + ({id: x.reqId||"?", points: `${x.reqId||"?"} ${_ptReqOp[x.operator]} ${x.reqPoints}`,
                                                                     pointCompare: `${x.reqId||"?"} ${_ptReqCmpOp[x.operator]} ${x.reqId1||"?"}`})[x.type] || "???";
          let _cost = score => "  " + (_points[score.id] || `"${score.beforeText}"`) + (score.value > 0 ? " " : " +") + (-parseInt(score.value||0)) +
            ((score.requireds||[]).length == 0 ? "" : "\t{" + score.requireds.map(_req(score)).join("  &  ") + "}");
          let _showImg = ({image}) => () => ($overview.image.src = image) && ($overview.image.style.display = '');
          let _hideImg = () => {[$overview.image.src, $overview.image.style.display] = ["", 'none']};
          let _rowAttrs = row => ({className: '-row-name', title: `[${row.id}]\n\n${row.titleText}`.trim(), onmouseenter: _showImg(row), onmouseleave: _hideImg});
          let _nav = e => () => {$overview.toggle(true);  e.scrollIntoView({block: 'start'})};
          let _dice = [1, 6, 0],  _roll = (n, m, k) => (_dice = [n, m, k, range(n).reduce(res => res + Math.floor(1 + m*Math.random()), k)], _dice[3]);
          let _setDice = idx => function () {this.value = parseInt(this.value)||_dice[idx];  _dice.splice(idx, 1, this.valueAsNumber)};
          $overview.toggle = (visible = !$overview.overlay.style.display) => {
            if (!visible) {
              $overview.roll.innerHTML = "<h3>Roll</h3>";
              $overview.roll.append( _node('div', {},
                ['p', {}, ['input', {type: 'number', title: "N", min: 1, value: _dice[0], onchange: _setDice(0)}], " d ",
                          ['input', {type: 'number', title: "M", min: 2, value: _dice[1], onchange: _setDice(1)}], " + ",
                          ['input', {type: 'number', title: "K",         value: _dice[2], onchange: _setDice(2)}], " = ",
                          ['button', {title: "ROLL", onclick () {this.innerText = _roll(..._dice)}}, `${_dice.length < 4 ? "(roll)" : _dice[3]}`]],
                "(NdM+K means rolling an M-sided die N times and adding K to the total)") );
              $overview.nav.innerHTML = "<h3>Navigation</h3>";
              [...document.querySelectorAll(["* > .row", "*"].map(s => `.v-application--wrap > ${s} > :not(.v-bottom-navigation) > :not(.col)`).join(", "))]
                .filter(e => !e.style.display).map(e => [e, e.__vue__._props.row])
                .forEach(([e, row]) => {$overview.nav.append( _node('div', {..._rowAttrs(row), onclick: _nav(e)}, row.title.trim() || ['i', {}, row.id]) )});
              $overview.activated.innerHTML = "<h3>Activated</h3>";
              $rowsActive().forEach(([row, items]) => {
                $overview.activated.append( _node('p', {className: '-row'},
                  ['span', _rowAttrs(row), row.title.trim() || ['i', {}, row.id]],
                  ": ",
                  ...[].concat(...items.map(item => [
                    ", ",
                    ['span', {className: '-item', title: [`[${item.id}]`, item.text, item.scores.map(_cost).join("\n")].filter(Boolean).join("\n\n").trim(),
                              onmouseenter: _showImg(item), onmouseleave: _hideImg},
                      ['span', {className: '-item-name'}, item.title.trim() || ['i', {}, item.id]],
                      !item.isActive && (item.isSelectableMultiple ? ` {×${item.multipleUseVariable}}` : " {Image}")],
                  ])).slice(1)));
              });
            }
            $overview.overlay.style.display = (visible ? 'none' : '');
          }
          $overview.toggle(false);
        }
      };
      GM_registerMenuCommand("Overview", $overview);
      GM_addStyle(`#LIST-TOGGLE {position:fixed; right:3px; bottom:3px; z-index:1001; color:var(--light); background:var(--gray);
                                 padding:1ex; width:auto; border-radius:1em}
                   .-FULL-SCAN #LIST-TOGGLE {color:var(--gray); background:var(--light)}`);
      document.body.append( _node('button', {id: 'LIST-TOGGLE', className: "v-icon mdi mdi-table-of-contents", title: "Overview/dice roll", onclick: $overview}) );
  
      function $cheat() {
        if (!$cheat.toggle) {
          const {reFrame: rf, reagent: r, util: {getIn, update, assocIn, merge, entries}} = require('mreframe');
          let updateIn = (o, path, f, ...args) => assocIn(o, path, f(getIn(o, path), ...args));
          const _ID = 'CHEAT', ID = '#'+_ID, _scroll = (s, bg='#2B2F35', thumb='grey', wk='::-webkit-scrollbar') =>
            `${s} {scrollbar-width:thin; scrollbar-color:${thumb} ${bg}}  ${s}${wk} {width:6px; height:6px; background:${bg}}  ${s}${wk}-thumb {background:${thumb}}`;
          GM_addStyle(`${ID} {position:fixed; bottom:0; left:0; z-index:1000; color:var(--light); background:var(--gray-dark); opacity:.75}  ${ID}:hover {opacity:1}
                       ${ID} .-frame {max-height:100vh; display:flex; flex-direction:column}  ${ID} .-scrollbox {overflow-y:auto}  ${_scroll(ID+" .-scrollbox")}
                       ${ID} h3 {text-align:center}  ${ID} table.-points td, ${ID} .-cheats {padding:.5ex}  ${ID} .-row {display:flex; flex-direction:row}
                       ${ID} button {background-color:var(--secondary); border-style:outset; border-radius:1em}
                       ${ID} td.-minus button, ${ID} tr.-minus :is(.-point-name, .-point-value) {background-color:var(--danger)}
                       ${ID} td.-plus  button, ${ID} tr.-plus  :is(.-point-name, .-point-value) {background-color:var(--purple)}
                       ${ID} button.-cheats {background: var(--cyan)}`);
          document.body.append($cheat.UI = _node('div', {id: _ID}));
          $cheat.toggle = () => rf.disp(['toggle-ui']);
  
          let _points = pointTypes => pointTypes.map(points => [points.id, points.name, points.beforeText, points.startingSum]);
          $store().watch(state => _points(state.app.pointTypes), points => rf.disp(['cache-points', points]));
          let _upd = rf.after(({show, cache, ...data}) => {$cheat.data = data});
  
          rf.regEventDb('init-db', [_upd], (db, [_, {points={}}={}]) => ({
            show: false,
            points,
            cache: db.cache || {points: []},
          }));
          rf.regEventDb('toggle-ui', [_upd], db => update(db, 'show', x => !x));
          rf.regEventFx('point-add!', [_upd], ({db}, [_, id, n]) => ({db:     updateIn(db, ['points', id], x => (x||0)+n),
                                                                      points: [{id, add: n}]}));
          rf.regEventFx('reset-cheats!', [_upd], ({db}) => ({db:     merge(db, {points: {}}),
                                                             points: entries(db.points).map(([id, n]) => ({id, add: -n}))}));
          rf.regEventDb('cache-points', [_upd], (db, [_, points]) => assocIn(db, ['cache', 'points'], points));
  
          rf.regFx('points', changes => changes.forEach(({id, add}) => {$pointTypes().find(x => x.id == id).startingSum += add}));
  
          rf.regSub('show',       getIn);
          rf.regSub('points',     getIn);
          rf.regSub('cache',      getIn);
          rf.regSub('cheating?',  db => true);
          rf.regSub('points*',    ([_, id]) => rf.subscribe(['points', id]), n => n||0);
          let _change = n => (!n ? "" : `${n < 0 ? n : '+'+n}`);
          rf.regSub('point-show', ([_, id]) => rf.subscribe(['points', id]), _change);
          rf.regSub('point-changes', '<-', ['cache', 'points'], '<-', ['points'], ([points, o]) =>
            points.filter(([id]) => o[id]).map(([id, name, show]) => [`[${id}] ` + (show||`(${name})`), o[id]]));
          rf.regSub('tooltip', '<-', ['point-changes'], changes =>
            changes.map(([points, change]) => `${points} ${_change(change)}`).join("\n"));
          rf.regSub('cheating?', '<-', ['point-changes'], changes => changes.length > 0);
  
          let PointAdd = id => n => ['button', {onclick: () => rf.disp(['point-add!', id, n])}, (n > 0) && '+', n];
          let Points = () => ['table.-points', ...rf.dsub(['cache', 'points']).map(([id, name, show, amount]) =>
            ['tr', {class: [{1: '-plus', '-1': '-minus'}[Math.sign(rf.dsub(['points*', id]))]],
                    title: rf.dsub(['point-show', id])},
              ['td.-minus', ...[-100, -10, -1].map( PointAdd(id) )],
              ['td.-point-name', "[", ['tt', id], "]", ['br'], show||['em', "<untitled>"], ['br'], `(${name})`],
              ['td.-point-value', amount],
              ['td.-plus', ...[+100, +10, +1].map( PointAdd(id) )]])];
          let Frame = (...body) => ['.-frame',
            ['h3', {title: rf.dsub(['tooltip'])}, "Points"],
            ['.-scrollbox', ...body],
            ['div.-row', {title: rf.dsub(['tooltip'])},
               ['button', {onclick: $cheat}, (rf.dsub(['cheating?']) ? "< HIDE" : "× CLOSE")],
               rf.dsub(['cheating?']) && ['button', {onclick: () => rf.disp(['reset-cheats!'])}, "RESET"]]];
          let UI = () => (rf.dsub(['show']) ? [Frame, [Points]] :
                          rf.dsub(['cheating?']) && ['button.-cheats', {onclick: $cheat, title: rf.dsub(['tooltip'])}, " Cheats: on "]);
  
          rf.dispatchSync(['init-db']);
          rf.disp(['cache-points', _points( $pointTypes() )]);
          r.render([UI], $cheat.UI);
        }
        $cheat.toggle();
      }
      GM_registerMenuCommand("Cheat engine", $cheat);
    };
  })();
  })()})()}catch(e){VM2cgznlnlgyx(e)}};0
