#!/usr/bin/env python3
"""Assemble v2/index.html from template + sections, and concatenate CSS/JS.

  python3 v2/build.py            -> v2/index.html, v2/assets/site.css, v2/assets/site.js
  python3 v2/build.py --artifact -> v2/dist/preview.html (everything inlined, images as data URIs)
"""
import base64, os, re, sys, mimetypes

ROOT = os.path.dirname(os.path.abspath(__file__))
ORDER = ["hero", "map", "phone", "features", "lines", "establishers", "tail"]
APPLE = "https://apps.apple.com/app/id6767085401"
PLAY = "https://play.google.com/store/apps/details?id=app.chalkmap.v2"


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def fix_links(html):
    html = re.sub(r'href="https://apps\.apple\.com/[^"]*"', 'href="%s"' % APPLE, html)
    html = re.sub(r'href="https://play\.google\.com/[^"]*"', 'href="%s"' % PLAY, html)
    return html


def build():
    tpl = read(os.path.join(ROOT, "template.html"))
    sections, css, js = [], [read(os.path.join(ROOT, "assets/css/base.css"))], [read(os.path.join(ROOT, "assets/js/core.js"))]
    missing = []
    for name in ORDER:
        h = os.path.join(ROOT, "sections", name + ".html")
        c = os.path.join(ROOT, "assets/css", name + ".css")
        j = os.path.join(ROOT, "assets/js", name + ".js")
        if os.path.exists(h):
            sections.append(read(h))
        else:
            missing.append(h)
        if os.path.exists(c):
            css.append("/* ---- %s ---- */\n" % name + read(c))
        if os.path.exists(j):
            js.append("/* ---- %s ---- */\n" % name + read(j))
    with open(os.path.join(ROOT, "assets/site.css"), "w", encoding="utf-8") as f:
        f.write("\n".join(css))
    with open(os.path.join(ROOT, "assets/site.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(js))
    html = tpl.replace("{{SECTIONS}}", "\n".join(sections))
    html = html.replace("{{CSS}}", '<link rel="stylesheet" href="assets/site.css">')
    html = html.replace("{{JS}}", '<script src="assets/site.js"></script>')
    html = fix_links(html)
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    em = html.count("—") + html.count("&mdash;")
    print("built index.html: %d sections, %d bytes, emdash=%d, missing=%s" % (len(sections), len(html), em, [os.path.basename(m) for m in missing]))
    return html


def to_data_uri(path):
    mt = mimetypes.guess_type(path)[0] or "application/octet-stream"
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (mt, base64.b64encode(f.read()).decode())


def artifact(html):
    """Inline everything for a claude.ai artifact preview: CSS+JS inline, images as data URIs (prefer 1200 variants)."""
    css = read(os.path.join(ROOT, "assets/site.css"))
    js = read(os.path.join(ROOT, "assets/site.js"))
    # downgrade 1920 -> 1200 to keep under the 16MB cap
    for w in ("-1920", "-1200"):
        html = html.replace(w + ".webp", "-720.webp").replace(w + ".jpg", "-720.webp")
        css = css.replace(w + ".webp", "-720.webp").replace(w + ".jpg", "-720.webp")
    html = html.replace("-720.jpg", "-720.webp").replace("japan-map.png", "japan-map.webp")
    css = css.replace("-720.jpg", "-720.webp").replace("japan-map.png", "japan-map.webp")
    html = re.sub(r'(screen-[a-z]+(?:-ja)?)\.png', r"\1-sm.webp", html)
    html = re.sub(r'\s(srcset|sizes)="[^"]*"', "", html)
    html = re.sub(r'<source type="image/jpeg"[^>]*>', "", html)
    # srcset with multiple candidates: keep only the first candidate
    def srcset_fix(m):
        first = m.group(1).split(",")[0].strip().split(" ")[0]
        return 'srcset="%s"' % first
    html = re.sub(r'srcset="([^"]+)"', srcset_fix, html)
    # inline data JSON so fetch() is not needed (CSP blocks fetch)
    data = {}
    for fn in ("lines.json", "crags.json", "stats.json"):
        p = os.path.join(ROOT, "assets/data", fn)
        if os.path.exists(p):
            data["assets/data/" + fn] = read(p)
    inline_data = "window.CM_INLINE_DATA=" + __import__("json").dumps(data) + ";" \
        "(function(){var f=window.fetch;window.fetch=function(u,o){var k=(typeof u==='string')?u:(u&&u.url);if(k&&window.CM_INLINE_DATA[k]){return Promise.resolve(new Response(window.CM_INLINE_DATA[k],{status:200,headers:{'Content-Type':'application/json'}}));}return f.apply(this,arguments);};})();"
    # images in html and css
    cache = {}
    def img_uri(rel):
        rel = rel.split("?")[0]
        p = os.path.normpath(os.path.join(ROOT, rel))
        if not os.path.exists(p):
            return None
        if p not in cache:
            cache[p] = to_data_uri(p)
        return cache[p]
    def repl_attr(m):
        uri = img_uri(m.group(2))
        return '%s="%s"' % (m.group(1), uri) if uri else m.group(0)
    html = re.sub(r'(src|srcset|data-src-en|data-src-ja|data-src|poster)="(assets/img/[^"]+)"', repl_attr, html)
    def repl_css(m):
        uri = img_uri(m.group(1).strip("'\""))
        return "url(%s)" % uri if uri else m.group(0)
    css = re.sub(r"url\((['\"]?)(assets/img/[^)'\"]+)\1\)", lambda m: repl_css(type("M", (), {"group": lambda s, i: m.group(2)})()), css)
    # css written by sections may reference ../img/ from assets/css -> normalize
    css = re.sub(r"url\((['\"]?)\.\./img/([^)'\"]+)\1\)", lambda m: "url(%s)" % (img_uri("assets/img/" + m.group(2)) or "../img/" + m.group(2)), css)
    out = html.replace('<link rel="stylesheet" href="assets/site.css">', "<style>\n" + css + "\n</style>")
    out = out.replace('<script src="assets/site.js"></script>', "<script>" + inline_data + "</script>\n<script>\n" + js + "\n</script>")
    # strip doctype/html/head/body wrappers: the artifact host provides them; keep <title>, links, meta theme
    m = re.search(r"<head>(.*?)</head>", out, re.S)
    head = m.group(1) if m else ""
    body = re.search(r"<body[^>]*>(.*)</body>", out, re.S).group(1)
    head_keep = "\n".join(l for l in head.splitlines() if ("<title>" in l or "fonts.googleapis" in l or "<style>" in l or "</style>" in l or not l.strip().startswith("<")) )
    # simpler: keep title + font links + the style block wholesale
    title = re.search(r"<title>.*?</title>", head, re.S).group(0)
    fonts = "\n".join(re.findall(r'<link[^>]*fonts\.googleapis[^>]*>', head))
    style = re.search(r"<style>.*?</style>", out, re.S).group(0)
    page = title + "\n" + fonts + "\n" + style + "\n" + '<div data-lang="en" id="cm-root">' + body + "</div>"
    # body[data-lang] selectors -> #cm-root[data-lang]; core.js sets body attr: patch to also set root
    page = page.replace("body[data-lang=", "#cm-root[data-lang=")
    page = page.replace("document.body.setAttribute('data-lang', lang);", "document.body.setAttribute('data-lang', lang); var r=document.getElementById('cm-root'); if(r) r.setAttribute('data-lang', lang);")
    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    with open(os.path.join(ROOT, "dist/preview.html"), "w", encoding="utf-8") as f:
        f.write(page)
    print("artifact preview: %.1f MB, %d images inlined" % (len(page) / 1e6, len(cache)))


if __name__ == "__main__":
    html = build()
    if "--artifact" in sys.argv:
        artifact(html)
