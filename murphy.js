/* Murphy Photo Bank. Add to any project:
   <script src="https://YOUR-SITE.vercel.app/murphy.js"></script>

   Auto-fill:  <img data-murphy="happy">  (or data-murphy="right" / "wrong" / "any")
   Cutouts:    <img data-murphy="happy" data-cutout>  or  Murphy.random("happy", {cutout:true})
               (transparent PNG-style stickers with white outline; falls back to any cutout)
   Code:       Murphy.random("happy").then(p => img.src = p.url)
               Murphy.right()  Murphy.wrong()  Murphy.pick(["sad","worried"])
               Murphy.all()    Murphy.tags()   Murphy.caption(p)
   Each photo: { url, file, caption, tags, mood, pose, setting, props, age }  */
(function () {
  var base = (document.currentScript && document.currentScript.src || "").replace(/murphy\.js.*$/, "");
  var cache = null;
  function load() {
    if (!cache) cache = fetch(base + "photos.json").then(function (r) { return r.json(); }).then(function (d) {
      d.photos.forEach(function (p) {
        p.url = base + "photos/" + p.file; p.originalUrl = p.url;
        if (p.cutout) p.cutoutUrl = base + "cutouts/" + p.cutout;
      });
      return d;
    });
    return cache;
  }
  function choose(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }
  var last = null;
  function pickFrom(list) {
    var c = list.length > 1 ? list.filter(function (p) { return p.file !== last; }) : list;
    var p = choose(c); if (p) last = p.file; return p;
  }
  function match(d, key, opts) {
    var pool = d.photos;
    if (opts && opts.cutout) { var c = d.photos.filter(function (p) { return p.cutoutUrl; }); if (c.length) pool = c; d = { photos: pool, moodGroups: d.moodGroups }; }
    if (!key || key === "any") return d.photos;
    if (d.moodGroups[key]) key = d.moodGroups[key];
    var keys = [].concat(key).map(function (k) { return String(k).toLowerCase(); });
    var hit = d.photos.filter(function (p) { return keys.some(function (k) { return p.tags.indexOf(k) > -1; }); });
    return hit.length ? hit : d.photos;
  }
  var Murphy = {
    ready: load,
    all: function () { return load().then(function (d) { return d.photos; }); },
    tags: function () { return load().then(function (d) { var s = {}; d.photos.forEach(function (p) { p.tags.forEach(function (t) { s[t] = 1; }); }); return Object.keys(s).sort(); }); },
    random: function (key, opts) {
      return load().then(function (d) {
        var p = pickFrom(match(d, key, opts));
        if (p && opts && opts.cutout && p.cutoutUrl) p = Object.assign({}, p, { url: p.cutoutUrl });
        return p;
      });
    },
    pick: function (keys, opts) { return Murphy.random(keys, opts); },
    right: function (opts) { return Murphy.random("right", opts); },
    wrong: function (opts) { return Murphy.random("wrong", opts); },
    caption: function (p) { return p ? p.caption : ""; },
    fill: function (el, key, opts) {
      if (!opts && el && el.hasAttribute("data-cutout")) opts = { cutout: true };
      return Murphy.random(key, opts).then(function (p) {
        if (p && el) { el.src = p.url; el.alt = p.caption || "Murphy the dog"; el.dataset.caption = p.caption; }
        return p;
      }).catch(function () {});
    }
  };
  window.Murphy = Murphy;
  document.addEventListener("DOMContentLoaded", function () {
    [].forEach.call(document.querySelectorAll("img[data-murphy]"), function (el) { Murphy.fill(el, el.getAttribute("data-murphy")); });
  });
})();
