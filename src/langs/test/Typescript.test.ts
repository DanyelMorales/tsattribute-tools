import "ts-node";
import "mocha";
import { expect } from "chai";
import { TSParser, TypescriptStrategy, TypescriptCodeGen, TypescriptCommentGenerator } from "./../Typescript";
import { MomoThePug } from "../../Definitions";

function cleanspaces(str: string): string {
    return str.replace(/\s/mgi, "");
}

describe("Typescript Parser", () => {

    beforeEach(() => {
    });

    it("Should detect decorators ", () => {
        const result: MomoThePug.SymbolContainer = TSParser.parse("ffooo.ts", "@hello() @foo(x,x,x) readonly static foobar: Classz = \"Bare\";");
        expect(result.accessor).equals("readonly");
        expect(result.decorator).to.contains("@hello()");
        expect(result.id).to.be.equals("foobar");
        expect(result.value).to.contains('"Bare"');
        expect(result.type).to.be.equals("Classz");
        expect(result.static).to.be.true;
    });

    it("Should detect private with no decorators", () => {
        const result = (TSParser.parse("ffooo.ts", "private foobar: string = \"Bare\";"));
        expect(result.accessor).equals("private");
        expect(result.decorator).to.be.empty;
        expect(result.id).to.be.equals("foobar");
        expect(result.value).to.contains('"Bare"');
        expect(result.type).to.be.equals("string");
        expect(result.static).to.be.false;
    });

    it("Should parse with no type detect", () => {
        const result = (TSParser.parse("ffooo.ts", "public foobaxr = \"Bare\";"));
        expect(result.accessor).equals("public");
        expect(result.decorator).to.be.empty;
        expect(result.id).to.be.equals("foobaxr");
        expect(result.value).to.contains('"Bare"');
        expect(result.type).to.be.equals("any");
        expect(result.static).to.be.false;
    });

    it("Should parse only accessor with id", () => {
        const result = (TSParser.parse("ffooo.ts", "private foobar;"));
        expect(result.accessor).equals("private");
        expect(result.decorator).to.be.empty;
        expect(result.id).to.be.equals("foobar");
        expect(result.value.length).to.be.equals(1);
        expect(result.type).to.be.equals("any");
        expect(result.static).to.be.false;
    });

    it("Should detect public accessor", () => {
        const result = (TSParser.parse("ffooo.ts", "foobar;"));
        expect(result.accessor).equals("public");
        expect(result.decorator).to.be.empty;
        expect(result.id).to.be.equals("foobar");
        expect(result.value.length).to.be.equals(1);
        expect(result.type).to.be.equals("any");
        expect(result.static).to.be.false;
    });

    it("Should parse a string", () => {
        const result = (TSParser.parse("ffooo.ts", "public foobar:number = 45;"));
        expect(result.accessor).equals("public");
        expect(result.decorator).to.be.empty;
        expect(result.id).to.be.equals("foobar");
        expect(result.value).to.contains("45");
        expect(result.type).to.be.equals("number");
        expect(result.static).to.be.false;
    });

});

// TypescriptCommentGenerator
describe("Typescript comment generator", () => {

    let generator: TypescriptCommentGenerator;

    beforeEach(() => {
        generator = new TypescriptCommentGenerator();
        generator.addParam("foo", "any data", "string");
        generator.addParam("bar", "any bar");
        generator.addReturn("any type");
    });

    it("should append new params", () => {
        expect(generator.$comment.length).to.be.equals(3);
    });

    it("should reset comment container", () => {
        generator.reset();
        expect(generator.$comment.length).to.be.equals(0);
    });

    it("should generate comments", () => {
        const expected = `
        /**
        * @param foo string any data
        * @param bar  any bar
        * @return any type
        */
       `;
        expect(cleanspaces(generator.comments)).to.be.equals(cleanspaces(expected));
    });
});

describe("Typescript transformation", () => {
    const strategy: TypescriptStrategy = new TypescriptStrategy();
    beforeEach(() => {

    });

    it("Should convert to attribute", () => {
        let value: MomoThePug.ITranspiledResult = strategy.parse("private foo: string = '5555';", [MomoThePug.Transformable.ATTRIBUTE]);
        expect(cleanspaces(value.transformation[0].value)).to.be.equals(cleanspaces(" private   __foo : string = '5555';"));
        value = strategy.parse("foo: string = '5555';", [MomoThePug.Transformable.ATTRIBUTE]);
        expect(cleanspaces(value.transformation[0].value)).to.be.equals(cleanspaces(" private  __foo : string = '5555';"));
        value = strategy.parse("private foo: any = '5555';", [MomoThePug.Transformable.ATTRIBUTE]);
        expect(cleanspaces(value.transformation[0].value)).to.be.equals(cleanspaces(" private  __foo : any = '5555';"));
        value = strategy.parse("public foo = '5555';", [MomoThePug.Transformable.ATTRIBUTE]);
        expect(cleanspaces(value.transformation[0].value)).to.be.equals(cleanspaces(" private  __foo : any = '5555';"));
        value = strategy.parse("public foo:string;", [MomoThePug.Transformable.ATTRIBUTE]);
        expect(cleanspaces(value.transformation[0].value)).to.be.equals(cleanspaces(" private  __foo : string;"));
    });

    it("Should convert to getter", () => {
        let value: MomoThePug.ITranspiledResult = strategy.parse("private foo: string = '5555';", [MomoThePug.Transformable.GETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public  get foo() : string { return this.__foo; }"));
        value = strategy.parse("foo: string = '5555';", [MomoThePug.Transformable.GETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public  get foo() : string { return this.__foo; }"));
        value = strategy.parse("foo = '5555';", [MomoThePug.Transformable.GETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public  get foo() : any { return this.__foo; }"));
        value = strategy.parse("private foo = '5555';", [MomoThePug.Transformable.GETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public  get foo() : any { return this.__foo; }"));
    });

    it("Should convert to setter", () => {
        let value: MomoThePug.ITranspiledResult = strategy.parse("private foo: string = '5555';", [MomoThePug.Transformable.SETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public set foo(foo:string){this.__foo=foo;}"));
        value = strategy.parse("public foo = '5555';", [MomoThePug.Transformable.SETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public set foo(foo:any){this.__foo=foo;}"));
        value = strategy.parse("foo:string = '5555';", [MomoThePug.Transformable.SETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public set foo(foo:string){this.__foo=foo;}"));
        value = strategy.parse("foo;", [MomoThePug.Transformable.SETTER]);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public set foo(foo:any){this.__foo=foo;}"));
    });

    it("Should create a set of transformations", () => {
        const toParse = "@foo() @bar() private foo: string = '5555';";
        const transforms = [MomoThePug.Transformable.GETTER, MomoThePug.Transformable.SETTER, MomoThePug.Transformable.ATTRIBUTE];
        const value: MomoThePug.ITranspiledResult = strategy.parse(toParse, transforms);
        expect(value.transformation.length).to.be.equals(3);
        expect(cleanspaces(value.transformation[0].value)).to.contains(cleanspaces("public  get foo() : string { return this.__foo; }"));
        expect(cleanspaces(value.transformation[1].value)).to.contains(cleanspaces("public  set foo(foo : string){ this.__foo = foo; }"));
        expect(cleanspaces(value.transformation[2].value)).to.contains(cleanspaces("@foo() @bar()  private __foo:string='5555';"));
    });

    it("Should create multiline code", () => {
        const transforms = [MomoThePug.Transformable.GETTER, MomoThePug.Transformable.SETTER, MomoThePug.Transformable.ATTRIBUTE];
        const toParse = ` @foo()
        private data: string;
        private foo: string;
        public bar: string;`;
        const expected = `    
        @foo() private  __data : string ;
        private  __foo : string ;
        private  __bar : string ;
        public  get data() :string{return this.__data;}
        public  get foo() :string{return this.__foo;}
        public  get bar() :string{return this.__bar;}
        public  set data(data : string){this.__data = data;}
        public  set foo(foo : string){this.__foo = foo;}
        public  set bar(bar : string){ this.__bar = bar; }`;
        const result: string = TypescriptCodeGen.generator({
            comments: false
        }).extract(toParse, transforms);
        expect(cleanspaces(result)).to.contains(cleanspaces(expected));
    });
});