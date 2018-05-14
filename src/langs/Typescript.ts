import { MomoThePug } from "../Definitions";
import * as ts from "typescript";
/**
 * Typescript parser to walk ts nodes
 * 
 * TODO: append to end of document getters and setters, and attrs prepend to the start
 * TODO: create getters and setters from constructor attributes
 */
export class TSParser {
    readonly helper: MomoThePug.ITreeWalkerHelper<ts.SyntaxKind> = {
        val: [""]
    };
    readonly _symbols: MomoThePug.SymbolContainer = new MomoThePug.SymbolContainer();

    /**
     * Transpile a line of code into another line of code
     * 
     * @param name a typescript file to store transpiled code
     * @param input  code to extract ts nodes
     * @param target output code
     */
    static parse(name: string, input: string, target: ts.ScriptTarget = ts.ScriptTarget.ES5): MomoThePug.SymbolContainer {
        const instance = new TSParser();
        const sourceFile = ts.createSourceFile(name, input, target, true);
        instance.handleTerminals(sourceFile);
        return instance._symbols;
    }

    /**
     * @param node
     */
    private handleTerminals(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile:
                this._symbols.original = node.getText();
                break;
            case ts.SyntaxKind.Decorator:
                this._symbols.decorator.push(node.getText());
                break;
            case ts.SyntaxKind.StaticKeyword:
                this._symbols.static = true;
                break;
            case ts.SyntaxKind.Identifier:
                if (this.helper.prev === ts.SyntaxKind.ColonToken) {
                    this._symbols.type = node.getText();
                }
                else {
                    this._symbols.id = node.getText();
                }
                break;
            case ts.SyntaxKind.PrivateKeyword:
            case ts.SyntaxKind.PublicKeyword:
            case ts.SyntaxKind.ReadonlyKeyword:
            case ts.SyntaxKind.ProtectedKeyword:
                this._symbols.accessor = node.getText();
                break;
            case ts.SyntaxKind.ColonToken:
                this.helper.prev = node.kind;
                break;
            case ts.SyntaxKind.SemicolonToken:
                if (this.helper.prev === ts.SyntaxKind.FirstAssignment) {
                    this._symbols.value = this.helper.val;
                }
                break;
            case ts.SyntaxKind.FirstAssignment:
                this.helper.prev = node.kind;
                break;
            default:
                // almacenamos si no existe algo que los maneje
                if (this.helper.prev === ts.SyntaxKind.FirstAssignment) {
                    this.helper.val.push(node.getText());
                }
        }
        node.getChildren().forEach(c => this.handleTerminals(c));
    }
}

/**
 * Helper to create comments
 */
export class TypescriptCommentGenerator {
    private commentSep: string = '*';
    private comment: string[] = [];
    readonly startDelim: string = "/**";
    readonly endDelim: string = "*/";
    public get $comment(): string[] {
        return this.comment;
    }

    constructor() {
    }

    /**
     * reset comment container
     */
    reset(): TypescriptCommentGenerator {
        this.comment = [];
        return this;
    }

    /**
     * Append a new comment line to comment container
     * 
     * @param param line type
     * @param description (optional)
     * @param name  name of parameter without "\@" character
     * @param type of argument to document
     * @param sep default  '\*'
     */
    private addLine(param: string, description: string = "", name: string = "", type: string = ""): TypescriptCommentGenerator {
        const line = `${this.commentSep} @${param} ${name} ${type} ${description}`;
        this.comment.push(line);
        return this;
    }

    /**
     * Add text line to comment 
     * @param description 
     */
    addTextLine(description: string) {
        this.comment.push(`${this.commentSep} ${description}`);
        return this;
    }

    /**
     * Add return satement to comment container
     * @param description
     */
    addReturn(description: string) {
        return this.addLine("return", description);
    }

    /**
     * Add param to comment container
     * @param name 
     * @param description (optional)
     * @param type (optional)
     */
    addParam(name: string, description: string = "", type: string = "") {
        return this.addLine("param", description, name, type);
    }

    /**
     * @returns comment string from comment container.
     */
    get comments() {
        this.comment.unshift(this.startDelim);
        this.comment.push(this.endDelim);
        return this.comment.join("\n");
    }

}


/**
 * Main Code generator
 */
export class TypescriptStrategy implements MomoThePug.ILanguageStrategy {
    private code: string[] = [];
    private commentGenerator: TypescriptCommentGenerator = new TypescriptCommentGenerator();
    readonly notypeDelim: string = '<ignore>';

    constructor(private cfg?: MomoThePug.ITranspilerConfiguration) { }

    private buildAttribute(symbs: MomoThePug.SymbolContainer): string {
        const helper: MomoThePug.SymbolHelper = new MomoThePug.SymbolHelper(symbs);
        return `${helper.decorator} private ${helper.static} ${helper.id} : ${helper.type} ${helper.value}`;
    }

    private buildGetter(symbs: MomoThePug.SymbolContainer): string {
        const helper: MomoThePug.SymbolHelper = new MomoThePug.SymbolHelper(symbs);
        helper.$body = [`return this.${helper.id}`];
        helper.$args = [];

        return this.buildMethod(helper, MomoThePug.Transformable.GETTER, <MomoThePug.SymbolHelper>{
            id: symbs.id,
            accessor: "public"
        });
    }

    private buildComments(id: string, type: string, helper: MomoThePug.SymbolHelper) {
        if (this.cfg && !this.cfg.comments) {
            return;
        }

        this.commentGenerator.reset();
        this.commentGenerator.addTextLine(`Your description`);
        if (type !== this.notypeDelim) {
            this.commentGenerator.addReturn(id);
        }
        else if (helper.args && type === this.notypeDelim) {
            this.commentGenerator.addParam(id, "lorem ipsum", '');
        }
        this.code.push(this.commentGenerator.comments);
    }

    private buildMethod(helper: MomoThePug.SymbolHelper, transformable: MomoThePug.Transformable, override: MomoThePug.SymbolHelper | null = null): string {
        const type = `${(override && override.type) || helper.type}`;
        const typeWithDelim = type && type === this.notypeDelim ? "" : ":" + type;
        const accessor = (override && override.accessor) || helper.accessor;
        const id = (override && override.id) || helper.id;
        const subaccessor = helper.getSubAccessor(transformable);
        this.buildComments(id, type, helper);
        this.code.push(`${accessor} ${helper.static} ${subaccessor} ${id}(${helper.args}) ${typeWithDelim}`);
        this.code.push('{');
        this.code.push(`${helper.body}`);
        this.code.push('}');
        return this.code.join("\n");
    }

    private buildSetter(symbs: MomoThePug.SymbolContainer): string {
        const helper: MomoThePug.SymbolHelper = new MomoThePug.SymbolHelper(symbs);
        helper.$body = [`this.${helper.id} = ${symbs.id}`];
        helper.$args = [`${symbs.id} : ${helper.type}`];

        return this.buildMethod(helper, MomoThePug.Transformable.SETTER, <MomoThePug.SymbolHelper>{
            type: "<ignore>",
            id: symbs.id,
            accessor: "public"
        });
    }


    private applyTransformation(symbs: MomoThePug.SymbolContainer, to: MomoThePug.Transformable): MomoThePug.ITransformation {
        this.reset();
        let value = "";
        switch (to) {
            case MomoThePug.Transformable.ATTRIBUTE:
                value = this.buildAttribute(symbs);
                break;
            case MomoThePug.Transformable.GETTER:
                value = this.buildGetter(symbs);
                break;
            case MomoThePug.Transformable.SETTER:
                value = this.buildSetter(symbs);
                break;
            default:
                throw {
                    message: "unknown transformable option"
                };
        }
        return {
            to: to,
            value: value
        };
    }

    private reset(): void {
        this.code = [];
        this.commentGenerator.reset();
    }

    /**
     * Creade code from parser result
     * 
     * @param symbs parser output
     * @param to  output target
     */
    parse(input: string, to: MomoThePug.Transformable[]): MomoThePug.ITranspiledResult {
        const transformations: MomoThePug.ITransformation[] = new Array();
        const symbols = TSParser.parse('__unexistent_file_.ts', input);

        to.forEach((item) => {
            transformations.push(this.applyTransformation(symbols, item));
        });

        return {
            symbols: symbols,
            transformation: transformations
        };
    }

}

/**
 * Main class to be invoked from extension class
 */
export class TypescriptCodeGen implements MomoThePug.ILangCodeGen {
    readonly delimiter: string = "@@___@@";
    private strategy: TypescriptStrategy;

    static generator(cfg?: MomoThePug.ITranspilerConfiguration): TypescriptCodeGen {
        return new TypescriptCodeGen(cfg);
    }

    /**
     * @param cfg 
     */
    constructor(cfg?: MomoThePug.ITranspilerConfiguration) {
        this.strategy = new TypescriptStrategy(cfg);
    }

    private normalize(str: string): string[] {
        str = str.replace(/\r\n/g, "").replace(/;/g, this.delimiter).replace(/,/, this.delimiter);
        return str.split(this.delimiter).filter(x => x !== "") || [];
    }

    /**
     * Attribute has lower precedence than getter & setter.
     * getter has lower precedence than setter.
     * setter has a hig precedence.
     * 
     * TODO: create sorting strategys
     */
    private defaultSortStrategy(a: MomoThePug.ITransformation, b: MomoThePug.ITransformation): number {
        if (a.to === b.to) {
            return 0;
        }
        else if (a.to === MomoThePug.Transformable.ATTRIBUTE || (a.to === MomoThePug.Transformable.GETTER && b.to === MomoThePug.Transformable.SETTER)) {
            return -1;
        }
        return 1;
    }

    /**
     * 
     * @param selected text selected from editor
     * @param outputs collection of output targets
     * 
     * TODO: to implement sorting strategy, now it's just sorted grouping 
     * Attr group first, then Getter group, last Setter group"
     */
    extract(selected: string, outputs: MomoThePug.Transformable[]): string {
        let transformed: MomoThePug.ITransformation[] = [];
        let lines: string = "";
        const that = this;

        this.normalize(selected).forEach(line => {
            const value: MomoThePug.ITranspiledResult = that.strategy.parse(line, outputs);
            transformed = transformed.concat(value.transformation);
        });

        transformed.sort(this.defaultSortStrategy);
        transformed.forEach(element => {
            lines += element.value + "\n";
        });
        return lines;
    }
}