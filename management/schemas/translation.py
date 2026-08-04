#######################################################################
#                                                                     #
#                    TRANSLATION SCHEMAS                              #
#                                                                     #
#        Pydantic v2 models for the Google Translate Element widget.  #
#        - LanguageInfo / LanguagesResponse                           #
#        - TranslateWidgetConfig                                      #
#        - TranslateSnippetResponse                                   #
#                                                                     #
#######################################################################


from pydantic import BaseModel


class LanguageInfo(BaseModel):
    code: str
    name: str
    nativeName: str
    flag: str


class LanguagesResponse(BaseModel):
    success: bool
    languages: list[LanguageInfo]


class TranslateWidgetConfig(BaseModel):
    """Default configuration a frontend can use to inject the widget itself."""
    script_src: str
    page_language: str = "en"
    element_id: str = "google_translate_element"
    included_languages: str | None = None


class TranslateSnippetResponse(BaseModel):
    """HTML/JS snippet the frontend can embed on a page."""
    html: str
    script_src: str
    page_language: str
    included_languages: str | None = None


# ─── Server-side translation (POST /api/v1/translate/) ──────────────


class TranslateRequest(BaseModel):
    """Payload sent by the frontend to translate one or more strings."""
    texts: list[str]
    target: str
    source: str | None = None          # optional, defaults to auto-detect
    provider: str | None = None        # reserved for future multi-provider support


class TranslationItem(BaseModel):
    """Result for a single input string."""
    original: str
    translated: str
    provider: str
    error: str | None = None


class TranslateResponse(BaseModel):
    """Batch translation response — one TranslationItem per input string."""
    translations: list[TranslationItem]
    provider: str
    count: int
