# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r'C:\Users\Admin\Desktop\relay-docs')
OUT = ROOT / 'marketing' / 'app-store-mocks'
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1290, 2796
S = 3

COLORS = {
    'bg': '#09090b',
    'surface': '#111113',
    'surface2': '#1a1a1e',
    'border': '#27272a',
    'text': '#fafafa',
    'muted': '#a1a1aa',
    'muted2': '#52525b',
    'accent': '#10B981',
    'accent_soft': '#13372d',
    'danger': '#EF4444',
    'danger_soft': '#3a1717',
    'warning': '#F59E0B',
    'warning_soft': '#3c2b10',
}

FONT_DIRS = [Path(r'C:\Windows\Fonts')]
FONT_FILES = {
    ('regular', False): ['segoeui.ttf', 'arial.ttf'],
    ('bold', True): ['segoeuib.ttf', 'arialbd.ttf'],
    ('semibold', True): ['seguisb.ttf', 'arialbd.ttf'],
}


def load_font(size, bold=False, kind='regular'):
    candidates = FONT_FILES.get((kind, bold), [])
    for font_dir in FONT_DIRS:
        for name in candidates:
            path = font_dir / name
            if path.exists():
                return ImageFont.truetype(str(path), size * S)
    return ImageFont.load_default()


FONTS = {
    'title': load_font(34, bold=True),
    'section': load_font(28, bold=True),
    'body': load_font(15),
    'body_bold': load_font(15, bold=True),
    'small': load_font(13),
    'small_bold': load_font(13, bold=True),
    'tiny': load_font(11),
    'tiny_bold': load_font(11, bold=True),
    'headline': load_font(20, bold=True),
}


def rgba(hex_color, alpha=255):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4)) + (alpha,)


ICON_PATH = ROOT / 'app' / 'assets' / 'icon.png'
APP_ICON = Image.open(ICON_PATH).convert('RGBA') if ICON_PATH.exists() else None


def new_canvas():
    img = Image.new('RGBA', (W, H), rgba(COLORS['bg']))
    draw = ImageDraw.Draw(img)
    return img, draw


def scale(v):
    return int(v * S)


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=scale(radius), fill=fill, outline=outline, width=width)


def text(draw, x, y, value, font, fill, anchor='la'):
    draw.text((scale(x), scale(y)), value, font=font, fill=fill, anchor=anchor)


def multiline(draw, x, y, value, font, fill, spacing=6):
    draw.multiline_text((scale(x), scale(y)), value, font=font, fill=fill, spacing=scale(spacing))


def status_bar(draw):
    text(draw, 28, 22, '9:41', FONTS['small_bold'], COLORS['text'])
    draw.rounded_rectangle((scale(360), scale(18), scale(394), scale(34)), radius=scale(8), outline=rgba(COLORS['text']), width=scale(2))
    draw.rectangle((scale(394), scale(23), scale(398), scale(29)), fill=rgba(COLORS['text']))
    draw.rectangle((scale(364), scale(22), scale(388), scale(30)), fill=rgba(COLORS['text']))
    draw.polygon([(scale(330), scale(30)), (scale(338), scale(18)), (scale(346), scale(30))], fill=rgba(COLORS['text']))


def paste_icon(img, x, y, size):
    if APP_ICON is None:
        return
    icon = APP_ICON.resize((scale(size), scale(size)))
    img.alpha_composite(icon, (scale(x), scale(y)))


def divider(draw, y):
    draw.line((scale(20), scale(y), scale(410), scale(y)), fill=rgba(COLORS['border']), width=scale(1))


def chip(draw, x, y, w, label, fill, fg):
    rounded(draw, (scale(x), scale(y), scale(x + w), scale(y + 24)), 999, rgba(fill), None)
    text(draw, x + w / 2, y + 12, label, FONTS['tiny_bold'], fg, anchor='mm')


def nav_bar(draw, selected):
    top = 850
    draw.line((0, scale(top), W, scale(top)), fill=rgba(COLORS['border']), width=scale(1))
    items = [('Dashboards', 90), ('Alerts', 215), ('Settings', 340)]
    for idx, (label, x) in enumerate(items):
        color = COLORS['accent'] if idx == selected else COLORS['muted2']
        cy = 880
        if idx == 0:
            for dx in (0, 12):
                for dy in (0, 12):
                    rounded(draw, (scale(x + dx), scale(cy - 10 + dy), scale(x + dx + 8), scale(cy - 2 + dy)), 2, rgba(color))
        elif idx == 1:
            draw.ellipse((scale(x), scale(cy - 12), scale(x + 20), scale(cy + 6)), outline=rgba(color), width=scale(2))
            draw.rectangle((scale(x + 8), scale(cy + 6), scale(x + 12), scale(cy + 12)), fill=rgba(color))
        else:
            draw.ellipse((scale(x + 2), scale(cy - 10), scale(x + 18), scale(cy + 6)), outline=rgba(color), width=scale(2))
            draw.ellipse((scale(x + 8), scale(cy - 4), scale(x + 12), scale(cy)), fill=rgba(color))
        text(draw, x + 10, 912, label, FONTS['tiny'], color, anchor='mm')


def home_screen():
    img, draw = new_canvas()
    status_bar(draw)
    paste_icon(img, 164, 54, 28)
    text(draw, 205, 68, 'Relay', FONTS['headline'], COLORS['text'], anchor='mm')

    rounded(draw, (scale(122), scale(98), scale(308), scale(126)), 999, rgba(COLORS['surface']), rgba(COLORS['border']), scale(1))
    text(draw, 160, 112, 'Free plan', FONTS['tiny_bold'], COLORS['muted'])
    text(draw, 216, 112, '\u2022', FONTS['tiny'], COLORS['muted2'])
    text(draw, 258, 112, '2/3 dashboards', FONTS['tiny'], COLORS['muted2'])

    text(draw, 20, 162, 'Dashboards', FONTS['title'], COLORS['text'])
    text(draw, 20, 200, '3 apps', FONTS['small'], COLORS['muted'])

    rounded(draw, (scale(325), scale(162), scale(410), scale(198)), 999, rgba(COLORS['accent']), None)
    text(draw, 367, 180, '+ Add', FONTS['small_bold'], '#ffffff', anchor='mm')

    cards = [
        ('Production Ops', 'grafana.internal', 'Latency spike detected', '2m ago', '#10B981'),
        ('Trading Bot', 'bot.relayapp.dev', 'Order filled on BTC-USD', '11m ago', '#3B82F6'),
        ('Home Lab', '192.168.1.20', 'Backups completed successfully', '58m ago', '#F59E0B'),
    ]
    y = 230
    for name, host, notif, when, accent in cards:
        rounded(draw, (scale(16), scale(y), scale(414), scale(y + 108)), 16, rgba(COLORS['surface']), rgba(COLORS['border']), scale(1))
        rounded(draw, (scale(32), scale(y + 24), scale(80), scale(y + 72)), 12, rgba(accent), None)
        text(draw, 102, y + 30, name, FONTS['body_bold'], COLORS['text'])
        text(draw, 102, y + 54, host, FONTS['tiny'], COLORS['muted2'])
        draw.ellipse((scale(102), scale(y + 78), scale(108), scale(y + 84)), fill=rgba(COLORS['accent']))
        text(draw, 116, y + 81, f'{notif} \u2022 {when}', FONTS['tiny'], COLORS['muted'], anchor='lm')
        text(draw, 392, y + 54, '>', load_font(24, bold=True), COLORS['muted2'], anchor='mm')
        y += 124

    rounded(draw, (scale(16), scale(612), scale(414), scale(668)), 12, rgba(COLORS['accent_soft']), rgba(COLORS['accent'], 110), scale(1))
    text(draw, 32, 640, 'Plan limits apply in the mobile app.', FONTS['small_bold'], COLORS['text'])
    text(draw, 32, 660, 'Use Relay to launch dashboards and receive alerts on the go.', FONTS['tiny'], COLORS['muted'])

    nav_bar(draw, 0)
    img.save(OUT / 'relay-home-mock.png')


def alerts_screen():
    img, draw = new_canvas()
    status_bar(draw)
    text(draw, 20, 66, 'Alerts', FONTS['title'], COLORS['text'])
    text(draw, 362, 69, 'Mark all read', FONTS['small_bold'], COLORS['accent'], anchor='mm')

    alerts = [
        ('Deploy ready for approval', 'Staging promotion completed. Review before going live.', 'Production Ops', 'critical', '4m ago'),
        ('Heartbeat missed', 'No check-in received from the overnight runner.', 'Home Lab', 'warning', '19m ago'),
        ('Trade executed', 'Bought 0.35 ETH at $3,240.', 'Trading Bot', None, '1h ago'),
        ('Daily digest ready', 'Backup and monitoring jobs finished normally.', 'Production Ops', None, '3h ago'),
    ]
    y = 120
    for title_text, body, app_name, sev, when in alerts:
        fill = COLORS['accent_soft'] if sev else COLORS['surface2']
        rounded(draw, (scale(16), scale(y), scale(414), scale(y + 138)), 14, rgba(fill), rgba(COLORS['border']), scale(1))
        draw.ellipse((scale(30), scale(y + 24), scale(38), scale(y + 32)), fill=rgba(COLORS['accent']))
        text(draw, 48, y + 28, title_text, FONTS['body_bold'], COLORS['text'])
        text(draw, 382, y + 28, when, FONTS['tiny'], COLORS['muted2'], anchor='rm')
        multiline(draw, 30, y + 52, body, FONTS['small'], COLORS['muted'], spacing=4)
        text(draw, 30, y + 106, app_name, FONTS['tiny'], COLORS['muted2'])
        if sev == 'critical':
            chip(draw, 120, y + 98, 56, 'Critical', COLORS['danger_soft'], COLORS['danger'])
        elif sev == 'warning':
            chip(draw, 120, y + 98, 56, 'Warning', COLORS['warning_soft'], COLORS['warning'])
        y += 154

    rounded(draw, (scale(16), scale(756), scale(414), scale(804)), 12, rgba(COLORS['accent_soft']), rgba(COLORS['accent'], 110), scale(1))
    text(draw, 32, 780, 'Notification history is limited on the current plan.', FONTS['small'], COLORS['text'])

    nav_bar(draw, 1)
    img.save(OUT / 'relay-alerts-mock.png')


def add_dashboard_screen():
    img, draw = new_canvas()
    status_bar(draw)
    text(draw, 24, 66, '<', load_font(24, bold=True), COLORS['accent'])
    text(draw, 215, 66, 'Add App', FONTS['headline'], COLORS['text'], anchor='mm')
    text(draw, 388, 66, 'Save', FONTS['small_bold'], COLORS['accent'], anchor='mm')

    rounded(draw, (scale(183), scale(112), scale(247), scale(176)), 18, rgba(COLORS['accent']), None)
    text(draw, 215, 144, 'R', load_font(28, bold=True), '#ffffff', anchor='mm')

    def field(y, label, value, hint=None):
        text(draw, 20, y, label, FONTS['small'], COLORS['muted'])
        rounded(draw, (scale(16), scale(y + 16), scale(414), scale(y + 64)), 12, rgba(COLORS['surface']), rgba(COLORS['border']), scale(1))
        text(draw, 32, y + 40, value, FONTS['body'], COLORS['text'])
        if hint:
            text(draw, 20, y + 78, hint, FONTS['tiny'], COLORS['muted2'])

    field(206, 'Name', 'Trading Bot')
    field(300, 'URL', 'https://dashboard.relayapp.dev', 'Configured from relay.json')

    text(draw, 20, 392, 'Color', FONTS['small'], COLORS['muted'])
    swatches = ['#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6']
    x = 20
    for idx, col in enumerate(swatches):
        draw.ellipse((scale(x), scale(414), scale(x + 30), scale(444)), fill=rgba(col), outline=rgba(COLORS['text']) if idx == 0 else None, width=scale(2))
        x += 40

    rounded(draw, (scale(16), scale(470), scale(414), scale(566)), 14, rgba(COLORS['surface']), rgba(COLORS['border']), scale(1))
    text(draw, 32, 494, 'Heartbeat monitoring', FONTS['body_bold'], COLORS['text'])
    text(draw, 32, 520, 'Get alerted if your agent or cron job stops pinging Relay.', FONTS['small'], COLORS['muted'])
    rounded(draw, (scale(350), scale(490), scale(390), scale(514)), 12, rgba(COLORS['accent']), None)
    draw.ellipse((scale(368), scale(492), scale(388), scale(512)), fill=rgba('#ffffff'))

    text(draw, 20, 598, 'Webhook', FONTS['small'], COLORS['muted'])
    rounded(draw, (scale(16), scale(614), scale(414), scale(670)), 12, rgba(COLORS['surface']), rgba(COLORS['border']), scale(1))
    text(draw, 32, 645, 'A unique webhook URL will be generated when you save.', FONTS['small'], COLORS['muted'])

    img.save(OUT / 'relay-add-dashboard-mock.png')


def settings_screen():
    img, draw = new_canvas()
    status_bar(draw)
    text(draw, 20, 66, 'Settings', FONTS['title'], COLORS['text'])

    text(draw, 20, 126, 'PLAN', FONTS['tiny_bold'], COLORS['muted2'])
    rounded(draw, (scale(16), scale(146), scale(414), scale(350)), 16, rgba(COLORS['surface2']), rgba(COLORS['border']), scale(1))
    text(draw, 34, 174, 'Free', FONTS['headline'], COLORS['text'])
    chip(draw, 82, 164, 54, 'Active', COLORS['accent'], '#ffffff')
    text(draw, 34, 218, '2', FONTS['headline'], COLORS['text'])
    text(draw, 56, 219, '/ 3 dashboards', FONTS['tiny'], COLORS['muted2'])
    text(draw, 150, 218, '1', FONTS['headline'], COLORS['text'])
    text(draw, 172, 219, '/ 1 device', FONTS['tiny'], COLORS['muted2'])
    text(draw, 250, 218, '142', FONTS['headline'], COLORS['text'])
    text(draw, 292, 219, '/ 500 notifs/mo', FONTS['tiny'], COLORS['muted2'])
    rounded(draw, (scale(34), scale(254), scale(396), scale(306)), 12, rgba(COLORS['surface']), rgba(COLORS['border']), scale(1))
    multiline(draw, 52, 270, 'Plan changes are not available in the mobile app right now.', FONTS['small'], COLORS['muted'])

    text(draw, 20, 384, 'PREFERENCES', FONTS['tiny_bold'], COLORS['muted2'])
    rounded(draw, (scale(16), scale(404), scale(414), scale(520)), 12, rgba(COLORS['surface2']), rgba(COLORS['border']), scale(1))
    divider(draw, 462)
    text(draw, 34, 434, 'Theme', FONTS['body'], COLORS['text'])
    text(draw, 360, 434, 'System', FONTS['body'], COLORS['muted'], anchor='rm')
    text(draw, 34, 492, 'Notifications', FONTS['body'], COLORS['text'])
    text(draw, 360, 492, 'Enabled', FONTS['body'], COLORS['muted'], anchor='rm')

    text(draw, 20, 554, 'QUIET HOURS', FONTS['tiny_bold'], COLORS['muted2'])
    rounded(draw, (scale(16), scale(574), scale(414), scale(764)), 12, rgba(COLORS['surface2']), rgba(COLORS['border']), scale(1))
    divider(draw, 632)
    divider(draw, 690)
    text(draw, 34, 604, 'Enable quiet hours', FONTS['body'], COLORS['text'])
    rounded(draw, (scale(346), scale(592), scale(386), scale(616)), 12, rgba(COLORS['accent']), None)
    draw.ellipse((scale(364), scale(594), scale(384), scale(614)), fill=rgba('#ffffff'))
    text(draw, 34, 662, 'Start', FONTS['body'], COLORS['text'])
    text(draw, 360, 662, '23:00', FONTS['body'], COLORS['muted'], anchor='rm')
    text(draw, 34, 720, 'End', FONTS['body'], COLORS['text'])
    text(draw, 360, 720, '07:00', FONTS['body'], COLORS['muted'], anchor='rm')
    text(draw, 34, 748, 'Critical notifications will still break through quiet hours.', FONTS['tiny'], COLORS['muted2'])

    nav_bar(draw, 2)
    img.save(OUT / 'relay-settings-mock.png')


for fn in (home_screen, alerts_screen, add_dashboard_screen, settings_screen):
    fn()

print('Generated mock screenshots in', OUT)
