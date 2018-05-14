/** 
 * @author Daniel Vera Morales <danyelmorales1991@gmail.com> 
 */
export namespace MomoThePug {

    /**
     * Attributes parts container for string convertion
     */
    export class SymbolHelper {
        private _body: string[] = [];

        private _args: string[] = [];
        constructor(private symbs: SymbolContainer) { }

        get $body(): string[] {
            return this._body;
        }

        get $args(): string[] {
            return this._args;
        }

        set $body(body: string[]) {
            this._body = body;
        }
        set $args(args: string[]) {
            this._args = args;
        }
        get decorator(): string {
            return this.symbs.decorator.filter(x => x !== "").join("\n");
        }
        get accessor(): string { return this.symbs.accessor; }
        get id(): string { return "__" + this.symbs.id; }
        get value(): string {
            const filtered = this.symbs.value ? this.symbs.value.filter(x => x !== "") : [];
            let delim: string = ";";
            if (filtered.length > 0) {
                return "= " + filtered.join(delim) + delim;
            }
            return delim;
        }
        get static(): string { return this.symbs.static ? "static" : ""; }
        get type(): string { return (this.symbs.type || "any"); }
        get body(): string {
            return this._body.filter(x => x !== "").join("; ") + ";";
        }
        get args(): string {
            return this._args.join(", ");
        }

        getSubAccessor(transformable: MomoThePug.Transformable): string {
            if (transformable === MomoThePug.Transformable.GETTER) {
                return "get";
            }
            else if (transformable === MomoThePug.Transformable.SETTER) {
                return "set";
            }
            return "";
        }
    }

    /**
     * Attribute parts container 
     */
    export class SymbolContainer {
        private _original: string = "";
        private _decorator: string[] = [];
        private _accessor: string = "public";
        private _id: string = "";
        private _value: string[] = [""];
        private _static: boolean = false;
        private _type: string = "any";

        get original(): string { return this._original; }
        get decorator(): string[] { return this._decorator; }
        get accessor(): string { return this._accessor; }
        get id(): string { return this._id; }
        get value(): string[] { return this._value; }
        get static(): boolean { return this._static; }
        get type(): string { return this._type; }

        set original(value: string) { this._original = value; }
        set decorator(value: string[]) { this._decorator = value; }
        set accessor(value: string) { this._accessor = value; }
        set id(value: string) { this._id = value; }
        set value(value: string[]) { this._value = value; }
        set static(value: boolean) { this._static = value; }
        set type(value: string) { this._type = value; }
    }

    /**
     * Allowed transformations
     */
    export enum Transformable {
        GETTER, SETTER, ATTRIBUTE, METHOD
    }

    /**
     * Single line transformation result.
     * 
     * to: transformation target
     * value: string transformation result 
     */
    export interface ITransformation {
        to: Transformable;
        value: string;
    }

    /**
     * Result container from transpiler 
     */
    export interface ITranspiledResult {
        /* result from tree walker */
        symbols: SymbolContainer;
        /* expected output types  */
        transformation: ITransformation[];
    }

    /**
     * comments: true if transpiler should generate comments for output code
     */
    export interface ITranspilerConfiguration {
        comments: boolean;
    }

    /**
     * Main transpilation interface 
     */
    export interface ILanguageStrategy {
        /**
         * turns a line of code into another code fragment
         * @param input code to transpile
         * @param to container of wanted outputs
         */
        parse(input: string, to: Transformable[]): ITranspiledResult;
    }

    /**
     * Helps to save state for tree walker
     */
    export interface ITreeWalkerHelper<E> {
        prev?: E;
        val: string[];
    }

    /**
     * Main entry point from any extention system
     */
    export interface ILangCodeGen {
        extract(selected: string, outputs: MomoThePug.Transformable[]): string;
    }
}

