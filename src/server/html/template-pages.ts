
import HTMLPage from './dynamic-html'

const HTML_TEMPLATE_PAGES = {
    homepage: new HTMLPage(),
    mainpage: new HTMLPage()
}

function AddGeneralMetaTags(template_page: HTMLPage) {
    template_page.AddMetaTag({ charset: 'utf-8' })
    template_page.AddMetaTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' })
}

function InjectReactResourceFiles(template_page: HTMLPage) {
    template_page.AddScript('/react')
    template_page.AddScript('/react-dom')
    template_page.AddScript('/remix-router')
    template_page.AddScript('/react-router')
    template_page.AddScript('/react-router-dom')
}

function InitializeHtmlTemplatePages() {

    AddGeneralMetaTags(HTML_TEMPLATE_PAGES.homepage)
    InjectReactResourceFiles(HTML_TEMPLATE_PAGES.homepage)
    HTML_TEMPLATE_PAGES.homepage.SetReactPage('/pages/homepage.js')
    HTML_TEMPLATE_PAGES.homepage.AddStylesheet('/assets/css/homepage.css')
    HTML_TEMPLATE_PAGES.homepage.SetTitle('foto - a cloud photo album')


    AddGeneralMetaTags(HTML_TEMPLATE_PAGES.homepage)
    InjectReactResourceFiles(HTML_TEMPLATE_PAGES.mainpage)
    HTML_TEMPLATE_PAGES.mainpage.AddScript('/jquery')
    HTML_TEMPLATE_PAGES.mainpage.SetReactPage('/pages/main.js')
    HTML_TEMPLATE_PAGES.mainpage.AddStylesheet('/assets/css/main.css')
    HTML_TEMPLATE_PAGES.mainpage.SetTitle('foto')

}

InitializeHtmlTemplatePages()

export default HTML_TEMPLATE_PAGES

