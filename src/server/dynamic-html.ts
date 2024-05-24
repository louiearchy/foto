
type Attributes = Object

function IsString(value: any): boolean {
    return typeof value === "string"
}

function IsBoolean(value: any): boolean {
    return typeof value === "boolean"
}

function IsNumber(value: any): boolean {
    return typeof value === "number"
}

/**
 * This is a class representation of an XMLTag in which all other HTML Tag classes derived
 * from. It automatically assumes the nature of the XMLTag (if it's a self-closing tag like <meta> or
 * or paired tag like <head></head>) by checking whether if it has children of XML Tags, or have an inner text.
 * Or by explicitly setting that it is a paired tag through `this.isPairedTag`
 */
class XMLTag {

    public tagname: string
    public attributes: Attributes
    public children: XMLTag[]
    protected isChanged: boolean
    protected buffer: string
    protected innerTextChildren: string
    protected isPairedTag: boolean


    constructor(tagname: string) {
        this.tagname = tagname
        this.attributes = {}
        this.isChanged = true
        this.buffer = ""
        this.children = []
        this.innerTextChildren = ""
        this.isPairedTag = false
    }

    public AddAttributes(attributes: Attributes) {
        Object.assign(this.attributes, attributes)
        this.isChanged = true
    }

    public AddChildTag(childTag: XMLTag) {
        this.children.push(childTag)
        this.isPairedTag = true
    }

    public AddInnerText(innerText: string) {
        this.innerTextChildren += innerText
        this.isPairedTag = true
    }

    protected WithAttributes(): boolean {
        return Object.keys(this.attributes).length > 0
    }

    protected WithChildren(): boolean {
        return this.children.length > 0
    }
    
    protected WithInnerText(): boolean {
        return this.innerTextChildren.length > 0
    }

    protected AddEndTag() {
        this.buffer += `</${this.tagname}>`
    }

    protected CompileAttributes() {
        for (const [key, value] of Object.entries(this.attributes)) {
            this.buffer += ` ${key}=`
            if (IsString(value) || IsBoolean(value)) {
                this.buffer += `"${value}"`
            }
            else if (IsNumber(value)) {
                this.buffer += `${value}`
            }
        }
        this.buffer += '>'
    }

    protected CompileChildren() {
        for (const child of this.children) {
            this.buffer += child.data
        }
    }

    protected Compile() {
        this.buffer = `<${this.tagname}`
        
        if (this.WithAttributes()) {
            this.CompileAttributes()
        }
        else /* if there is no attributes given */ {
            this.buffer += '>'
        }

        let withEndTag = this.isPairedTag

        if (this.WithInnerText()) {
            this.buffer += this.innerTextChildren
        }

        if (this.WithChildren()) {
            this.CompileChildren()
        }

        if (withEndTag)
            this.AddEndTag();


    }

    get data(): string {
        if (this.isChanged) {
            this.Compile()
            this.isChanged = false
        }
        return this.buffer
    }

}

class HTMLTag extends XMLTag {
    constructor() {
        super("html")
    }
}

class HTMLHeadTag extends XMLTag {
    constructor() {
        super("head")
    }
}

class HTMLBodyTag extends XMLTag {
    constructor() {
        super("body")
        this.isPairedTag = true
    }
}

class HTMLMetaTag extends XMLTag {
    constructor() {
        super("meta")
    }
}

class HTMLScriptTag extends XMLTag {
    constructor() {
        super("script")
        this.isPairedTag = true
    }
}

class HTMLTitleTag extends XMLTag {
    constructor() {
        super("title")
    }
}

export default class HTMLPage {
    
    protected buffer: string
    protected htmlTag: HTMLTag
    protected htmlHeadTag: HTMLHeadTag
    protected htmlBodyTag: HTMLBodyTag
    protected isChanged: boolean

    constructor() {
        this.buffer = ""
        this.htmlTag = new HTMLTag()
        this.htmlHeadTag = new HTMLHeadTag()
        this.htmlBodyTag = new HTMLBodyTag()
        this.isChanged = true
        
        // integration of child tags (<head>, <body>) to the <html> tag
        this.htmlTag.AddChildTag(this.htmlHeadTag)
        this.htmlTag.AddChildTag(this.htmlBodyTag)
    }

    AddMetaTag(attributes: Attributes)  {
        let newMetaTag = new HTMLMetaTag()
        newMetaTag.AddAttributes(attributes)
        this.htmlHeadTag.AddChildTag(newMetaTag)
        this.isChanged = true
    }

    AddScript(src: string) {
        let newScriptTag = new HTMLScriptTag()
        newScriptTag.AddAttributes({src})
        this.htmlHeadTag.AddChildTag(newScriptTag)
        this.isChanged = true
    }

    SetTitle(title: string) {
        let titleTag = new HTMLTitleTag()
        titleTag.AddInnerText(title)
        this.htmlHeadTag.AddChildTag(titleTag)
        this.isChanged = true
    }

    get data(): string {
        return this.htmlTag.data
    }

}