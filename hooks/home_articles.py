"""Build homepage cards from the same posts and URLs as Material's blog plugin."""
from datetime import datetime
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

import markdown
from mkdocs.utils import get_relative_url
from mkdocs.plugins import event_priority
from mkdocs.structure.files import InclusionLevel

MARKER = '<!-- home-articles -->'


class Paragraphs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == 'p':
            self.current = []

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == 'p' and self.current is not None:
            self.items.append(''.join(self.current).strip())
            self.current = None


def summary(post):
    if post.meta.get('description'):
        text = str(post.meta['description'])
    else:
        parser = Paragraphs()
        parser.feed(markdown.markdown(post.markdown.split('<!-- more -->')[0]))
        text = ' '.join(p for p in parser.items if not p.startswith('適用對象'))
    text = ' '.join(text.split())
    return text if len(text) <= 150 else text[:150].rstrip() + '…'


def render_cards(posts, page, config, files, today=None):
    today = today or datetime.now(ZoneInfo('Asia/Taipei')).date()
    posts = sorted(
        (p for p in posts if not p.config.draft and p.config.date.created.date() <= today),
        key=lambda p: (p.config.date.created, p.file.src_uri), reverse=True,
    )[:3]
    if not posts:
        return '<p>專欄文章準備中。</p>'
    cards = []
    for number, post in enumerate(posts):
        url = escape(get_relative_url(post.url, page.url), quote=True)
        title = escape(str(post.meta.get('title') or post.title))
        date = post.config.date.created.strftime('%Y/%m/%d')
        iso_date = post.config.date.created.strftime('%Y-%m-%d')
        cover = str(post.meta.get('cover_image') or '')
        # Existing cover_image values are relative to docs/, as in blog posts.
        cover_file = files.get_file_from_path(cover) if cover else None
        if cover_file and Path(cover_file.abs_src_path).is_file() and not urlsplit(cover).scheme:
            src = escape(get_relative_url(cover_file.url, page.url), quote=True)
            media = f'<img src="{src}" alt="" loading="lazy" decoding="async" />'
        else:
            media = '<span>文章封面</span>'
        cards.append(f'''<article class="home-article-card" aria-labelledby="home-post-{number}">
  <a class="home-article-card__media" href="{url}" aria-label="{title}">{media}</a>
  <div class="home-article-card__content">
    <h3 class="home-article-card__title" id="home-post-{number}"><a href="{url}">{title}</a></h3>
    <p class="home-article-card__date"><time datetime="{iso_date}">{date}</time></p>
    <p>{escape(summary(post))}</p>
  </div>
</article>''')
    return '<div class="home-article-cards">\n' + '\n'.join(cards) + '\n</div>'


def on_page_markdown(markdown, *, page, config, files):
    if page.file.src_uri != 'index.md' or MARKER not in markdown:
        return markdown
    blog = config.plugins['material/blog'].blog
    return markdown.replace(MARKER, render_cards(blog.posts, page, config, files))


@event_priority(-60)
def on_files(files, *, config):
    """Apply the shared category cover after Material has loaded its posts."""
    # Material already assigned dated URLs to draft posts, but excluded their
    # files and omitted them from all blog views. Restore only explicitly
    # unlisted drafts as standalone pages, retaining that omission from views.
    for file in files:
        page = file.page
        if (file.src_uri.startswith('blog/posts/') and page
                and page.meta.get('unlisted') and page.meta.get('draft')):
            file.inclusion = InclusionLevel.NOT_IN_NAV
            page.meta['search'] = {'exclude': True}
    for post in config.plugins['material/blog'].blog.posts:
        if '威脅快報' in post.meta.get('categories', []):
            post.meta['cover_image'] = 'asserts/covers/threat-bulletin.png'
