import os

CAS = {
    '6-1-1': ('6.1.1', 'Data, Information & Knowledge'),
    '6-1-2': ('6.1.2', 'Why Organisations Need Data'),
    '6-1-3': ('6.1.3', 'How Data Is Generated'),
    '6-2':   ('6.2',   'Data Formats'),
    '6-3':   ('6.3',   'Data Systems'),
    '6-4':   ('6.4',   'Data Security and Management'),
}

def make_nav_strip(ca_key, step, prefix):
    ca_num, ca_name = CAS[ca_key]
    labels = ['FIELD TRAINING', 'CLASSROOM', 'SOLO MODULE']
    bc = (
        '<a href="' + prefix + 'topics.html" style="color:rgba(57,255,20,0.7);text-decoration:none;letter-spacing:0.5px;">TOPICS</a>'
        ' <span style="color:rgba(255,255,255,0.3);">&rsaquo;</span>'
        ' <span style="color:rgba(232,237,243,0.6);font-size:10px;">CA ' + ca_num + ' ' + ca_name.upper() + '</span>'
        ' <span style="color:rgba(255,255,255,0.3);">&rsaquo;</span>'
        ' <span style="color:#39FF14;font-weight:700;">' + labels[step-1] + '</span>'
    )
    steps_html = []
    for i, label in enumerate(labels):
        n = i + 1
        if n == step:
            s = '<span style="color:#39FF14;font-weight:700;">&bull; ' + str(n) + ' ' + label + '</span>'
        elif n < step:
            s = '<span style="color:rgba(57,255,20,0.4);">&bull; ' + str(n) + ' ' + label + '</span>'
        else:
            s = '<span style="color:rgba(232,237,243,0.25);">&#x25E6; ' + str(n) + ' ' + label + '</span>'
        steps_html.append(s)
    sep = ' <span style="color:rgba(255,255,255,0.15);">&#x2192;</span> '
    step_str = sep.join(steps_html)
    return (
        '\n<!-- MSM-CONTENT-NAV -->\n'
        '<nav class="msm-content-nav" aria-label="Content path navigation" '
        'style="font-family:\'Share Tech Mono\',monospace;background:rgba(0,0,0,0.55);'
        'border-bottom:1px solid rgba(57,255,20,0.12);padding:7px 20px;display:flex;'
        'align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;'
        'position:sticky;top:0;z-index:200;">\n'
        '  <div style="font-size:11px;letter-spacing:0.5px;">' + bc + '</div>\n'
        '  <div style="display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:1px;">'
        + step_str
        + ' <span style="display:inline-block;width:1px;height:10px;background:rgba(255,255,255,0.12);margin:0 4px;"></span>'
        ' <a href="' + prefix + 'hub.html" style="color:rgba(232,237,243,0.4);text-decoration:none;font-size:10px;letter-spacing:1px;">HUB</a>'
        ' <span style="color:rgba(255,255,255,0.15);">&#xB7;</span>'
        ' <a href="' + prefix + 'dashboard.html" style="color:rgba(232,237,243,0.4);text-decoration:none;font-size:10px;letter-spacing:1px;">DASHBOARD</a>'
        '</div>\n</nav>\n<!-- END MSM-CONTENT-NAV -->\n'
    )

def make_return_nudge(ca_key, prefix):
    ca_num, _ = CAS[ca_key]
    return (
        '\n<!-- MSM-RETURN-NUDGE -->\n'
        '<div id="msm-return-nudge" style="font-family:\'Share Tech Mono\',monospace;text-align:center;'
        'padding:28px 20px;border-top:1px solid rgba(57,255,20,0.15);margin-top:16px;">\n'
        '  <div style="font-size:10px;letter-spacing:2px;color:rgba(232,237,243,0.4);margin-bottom:8px;">SPACED RETRIEVAL</div>\n'
        '  <div style="font-size:12px;color:rgba(232,237,243,0.65);margin-bottom:12px;letter-spacing:0.5px;">'
        'Return Mission for CA ' + ca_num + ' is available on the Hub</div>\n'
        '  <a href="' + prefix + 'hub.html" style="display:inline-block;color:#39FF14;text-decoration:none;'
        'border:1px solid rgba(57,255,20,0.35);padding:8px 20px;font-size:11px;letter-spacing:2px;'
        'border-radius:4px;">&#x27F6; GO TO HUB</a>\n'
        '</div>\n<!-- END MSM-RETURN-NUDGE -->\n'
    )

def inject_after_body(html, content):
    idx = html.find('<body')
    if idx == -1: return html
    end = html.find('>', idx) + 1
    return html[:end] + content + html[end:]

def patch_active_nav(html, active_href):
    html = html.replace(' class="navlink active"', ' class="navlink"')
    html = html.replace(' class=\'navlink active\'', ' class=\'navlink\'')
    html = html.replace('href="' + active_href + '" class="navlink"', 'href="' + active_href + '" class="navlink active"')
    return html

def fix_hub_href(html):
    html = html.replace('href="../index.html" class="navlink"', 'href="../hub.html" class="navlink"')
    html = html.replace("href='../index.html' class='navlink'", "href='../hub.html' class='navlink'")
    return html

def patch_file(path, patcher):
    if not os.path.exists(path):
        print('SKIP:', path); return
    with open(path, 'r', encoding='utf-8') as f: html = f.read()
    new_html = patcher(html)
    if new_html == html: print('unchanged:', path); return
    with open(path, 'w', encoding='utf-8') as f: f.write(new_html)
    print('patched:', path)

for path, active_href in [('hub.html','hub.html'),('topics.html','topics.html'),('learn/index.html','learn/index.html'),('dashboard.html','dashboard.html')]:
    patch_file(path, lambda h, ah=active_href: patch_active_nav(h, ah))

FT = {'learn/6-1-1/index.html':('6-1-1',1,'../../'),'learn/6-1-2/index.html':('6-1-2',1,'../../'),'learn/6-1-3/index.html':('6-1-3',1,'../../'),'learn/6-2/index.html':('6-2',1,'../../'),'learn/6-3/index.html':('6-3',1,'../../'),'learn/6-4/index.html':('6-4',1,'../../')}
CLS = {'content-areas/classroom-611-v3.html':('6-1-1',2,'../'),'content-areas/classroom-612.html':('6-1-2',2,'../'),'content-areas/classroom-613.html':('6-1-3',2,'../'),'content-areas/classroom-62.html':('6-2',2,'../'),'content-areas/classroom-63.html':('6-3',2,'../'),'content-areas/classroom-64.html':('6-4',2,'../')}
SOLO = {'6-1-1/index.html':('6-1-1',3,'../'),'6-1-2/index.html':('6-1-2',3,'../'),'6-1-3/index.html':('6-1-3',3,'../'),'6-2/index.html':('6-2',3,'../'),'6-3/index.html':('6-3',3,'../'),'6-4/index.html':('6-4',3,'../')}

for path,(ca,step,prefix) in {**FT,**CLS}.items():
    def p(h,ca=ca,step=step,prefix=prefix):
        if 'MSM-CONTENT-NAV' in h: return h
        return inject_after_body(h, make_nav_strip(ca,step,prefix))
    patch_file(path, p)

for path,(ca,step,prefix) in SOLO.items():
    def p(h,ca=ca,step=step,prefix=prefix):
        if 'MSM-CONTENT-NAV' in h: return h
        h = inject_after_body(h, make_nav_strip(ca,step,prefix))
        h = fix_hub_href(h)
        if 'MSM-RETURN-NUDGE' not in h:
            h = h.replace('</body>', make_return_nudge(ca,prefix)+'</body>',1)
        return h
    patch_file(path, p)

print('ALL DONE')
