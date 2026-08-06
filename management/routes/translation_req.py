#######################################################################
#                                                                     #
#                    TRANSLATION API                                  #
#                                                                     #
#        Uses Google's official Translate Element widget.             #
#        The widget is a client-side JS include from Google;          #
#        the backend serves the HTML snippet + widget config.         #
#                                                                     #
#        - GET /            → HTML page containing the widget         #
#        - GET /widget      → same as / (alias, HTML)                 #
#        - GET /snippet     → JSON payload with HTML/JS to embed      #
#        - GET /config      → JSON config (default & supported langs) #
#        - GET /languages   → supported languages list                #
#                                                                     #
#######################################################################


from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse

from schemas.translation import (
    LanguageInfo,
    LanguagesResponse,
    TranslateWidgetConfig,
    TranslateSnippetResponse,
)


router = APIRouter()


# ─── Supported Languages (Google Translate codes) ───────────────────
SUPPORTED_LANGUAGES: list[dict] = [
    {"code": "en", "name": "English", "nativeName": "English", "flag": "🇺🇸"},
    {"code": "ht", "name": "Haitian Creole", "nativeName": "Kreyòl Ayisyen", "flag": "🇭🇹"},
    {"code": "es", "name": "Spanish", "nativeName": "Español", "flag": "🇪🇸"},
    {"code": "fr", "name": "French", "nativeName": "Français", "flag": "🇫🇷"},
    {"code": "pt", "name": "Portuguese", "nativeName": "Português", "flag": "🇵🇹"},
    {"code": "de", "name": "German", "nativeName": "Deutsch", "flag": "🇩🇪"},
    {"code": "it", "name": "Italian", "nativeName": "Italiano", "flag": "🇮🇹"},
    {"code": "zh-CN", "name": "Chinese (Simplified)", "nativeName": "简体中文", "flag": "🇨🇳"},
    {"code": "ja", "name": "Japanese", "nativeName": "日本語", "flag": "🇯🇵"},
    {"code": "ko", "name": "Korean", "nativeName": "한국어", "flag": "🇰🇷"},
    {"code": "ar", "name": "Arabic", "nativeName": "العربية", "flag": "🇸🇦"},
    {"code": "ru", "name": "Russian", "nativeName": "Русский", "flag": "🇷🇺"},
    {"code": "hi", "name": "Hindi", "nativeName": "हिन्दी", "flag": "🇮🇳"},
    {"code": "nl", "name": "Dutch", "nativeName": "Nederlands", "flag": "🇳🇱"},
    {"code": "sw", "name": "Swahili", "nativeName": "Kiswahili", "flag": "🇰🇪"},
    {"code": "ln", "name": "Lingala", "nativeName": "Lingála", "flag": "🇨🇩"},
]

DEFAULT_PAGE_LANGUAGE = "en"
GOOGLE_TRANSLATE_SCRIPT = (
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
)


def _build_widget_html(page_language: str, included_languages: str | None) -> str:
    """
    Build the exact HTML page Google recommends for embedding the
    Translate Element widget.
    """
    included_line = (
        f", includedLanguages: '{included_languages}'"
        if included_languages
        else ""
    )
    return f"""<!DOCTYPE html>
<html lang="{page_language}">
<head>
<meta charset="UTF-8" />
<title>Nee's Learning — Translate</title>
</head>
<body>
<h1>Welcome to Nee's Learning</h1>
<p>Use the widget below to translate this page.</p>
<div id="google_translate_element"></div>
<script type="text/javascript">
function googleTranslateElementInit() {{
    new google.translate.TranslateElement(
        {{ pageLanguage: '{page_language}'{included_line} }},
        'google_translate_element'
    );
}}
</script>
<script type="text/javascript" src="{GOOGLE_TRANSLATE_SCRIPT}"></script>
</body>
</html>"""


def _build_widget_snippet(page_language: str, included_languages: str | None) -> str:
    """The minimum HTML/JS block a frontend can drop into a page."""
    included_line = (
        f", includedLanguages: '{included_languages}'"
        if included_languages
        else ""
    )
    return f"""<div id="google_translate_element"></div>
<script type="text/javascript">
function googleTranslateElementInit() {{
    new google.translate.TranslateElement(
        {{ pageLanguage: '{page_language}'{included_line} }},
        'google_translate_element'
    );
}}
</script>
<script type="text/javascript" src="{GOOGLE_TRANSLATE_SCRIPT}"></script>"""


# =====================================================================
#                           ENDPOINTS
# =====================================================================


@router.get("/", response_class=HTMLResponse)
def translate_page(
    page_language: str = Query(DEFAULT_PAGE_LANGUAGE, description="Source page language code"),
    included_languages: str | None = Query(
        None, description="Comma-separated list of language codes to expose in the dropdown"
    ),
):
    """
    Returns a full HTML page that renders Google's Translate Element widget.
    Open it directly in a browser (or serve/iframe it) to translate the page.
    """
    return HTMLResponse(content=_build_widget_html(page_language, included_languages))


@router.get("/widget", response_class=HTMLResponse)
def translate_widget(
    page_language: str = Query(DEFAULT_PAGE_LANGUAGE),
    included_languages: str | None = Query(None),
):
    """Alias of `/` — returns the full HTML widget page."""
    return HTMLResponse(content=_build_widget_html(page_language, included_languages))


@router.get("/snippet", response_model=TranslateSnippetResponse)
def translate_snippet(
    page_language: str = Query(DEFAULT_PAGE_LANGUAGE),
    included_languages: str | None = Query(None),
):
    """
    Returns the HTML/JS snippet to embed the widget somewhere else,
    plus the config used to build it.
    """
    return TranslateSnippetResponse(
        html=_build_widget_snippet(page_language, included_languages),
        script_src=GOOGLE_TRANSLATE_SCRIPT,
        page_language=page_language,
        included_languages=included_languages,
    )


@router.get("/config", response_model=TranslateWidgetConfig)
def translate_config():
    """
    Returns the default widget configuration and script URL.
    Useful for a frontend that wants to inject the widget itself.
    """
    return TranslateWidgetConfig(
        script_src=GOOGLE_TRANSLATE_SCRIPT,
        page_language=DEFAULT_PAGE_LANGUAGE,
        element_id="google_translate_element",
        included_languages=",".join(l["code"] for l in SUPPORTED_LANGUAGES),
    )


@router.get("/languages", response_model=LanguagesResponse)
def get_supported_languages():
    """Return the list of languages exposed in the widget dropdown."""
    languages = [LanguageInfo(**lang) for lang in SUPPORTED_LANGUAGES]
    return LanguagesResponse(success=True, languages=languages)
