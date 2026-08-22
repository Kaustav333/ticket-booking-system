import urllib.request, re

html = urllib.request.urlopen('https://ticket-booking-system-git-master-kaustav5.vercel.app/').read().decode('utf-8')
matches = re.findall(r'src=\"([^\"]+\.js)\"', html)
if not matches:
    matches = re.findall(r'src=([^\s>]+\.js)', html)
print("Found JS files:", matches)
for js_path in matches:
    if not js_path.startswith('http'):
        if not js_path.startswith('/'):
            js_path = '/' + js_path
        url = 'https://ticket-booking-system-git-master-kaustav5.vercel.app' + js_path
    else:
        url = js_path
    print("Fetching", url)
    try:
        js = urllib.request.urlopen(url).read().decode('utf-8')
        if 'http://localhost' in js:
            print("WARNING: FOUND LOCALHOST IN BUNDLE:", url)
        else:
            match = re.search(r'baseURL:\"([^\"]+)\"', js)
            if match:
                print('API URL in bundle:', match.group(1))
            else:
                match2 = re.search(r'import\.meta\.env\.VITE_API_URL\|\|\"([^\"]+)\"', js)
                if match2:
                    print('API URL fallback found in bundle:', match2.group(1))
    except Exception as e:
        print("Error fetching", url, e)
