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
