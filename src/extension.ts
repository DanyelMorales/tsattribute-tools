/**
 * @author Daniel Vera Morales
 */
'use strict';

import * as vscode from 'vscode';
import { TypescriptCodeGen } from "./langs/Typescript";
import { MomoThePug } from "./Definitions";

const ConfigurationSectionName = "tsattribute-tools";
const commandBaseName = ConfigurationSectionName + ".buildcode";

/**
 * Plugin main entry point
 */
export function activate(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (editor && isTypeScriptDocument(editor.document)) {
        registerLocalCommands(editor, context).forEach((subscription) => {
            context.subscriptions.push(subscription);
        });
    }
}

/**
 * Our commands will be registered here
 * 
 * @param editor 
 * @param context 
 */
function registerLocalCommands(editor: vscode.TextEditor, context: vscode.ExtensionContext): any[] {
    const gettersAndSetters = vscode.commands.registerCommand(commandBaseName + '.getterAndSetter', () => {
        const config = createExtensionConfiguration();
        replaceCode(editor, TypescriptCodeGen.generator(config), [
            MomoThePug.Transformable.GETTER,
            MomoThePug.Transformable.SETTER,
            MomoThePug.Transformable.ATTRIBUTE
        ]);
    });
    const getters = vscode.commands.registerCommand(commandBaseName + '.getter', () => {
        const config = createExtensionConfiguration();
        replaceCode(editor, TypescriptCodeGen.generator(config), [
            MomoThePug.Transformable.GETTER,
            MomoThePug.Transformable.ATTRIBUTE
        ]);
    });
    const setters = vscode.commands.registerCommand(commandBaseName + '.setter', () => {
        const config = createExtensionConfiguration();
        replaceCode(editor, TypescriptCodeGen.generator(config), [
            MomoThePug.Transformable.SETTER,
            MomoThePug.Transformable.ATTRIBUTE
        ]);
    });
    const attributes = vscode.commands.registerCommand(commandBaseName + '.attributes', () => {
        const config = createExtensionConfiguration();
        replaceCode(editor, TypescriptCodeGen.generator(config), [MomoThePug.Transformable.ATTRIBUTE]);
    });
    return [attributes, gettersAndSetters, getters, setters];
}

/**
 * Get configuration from user workspace 
 */
function createExtensionConfiguration(): MomoThePug.ITranspilerConfiguration {
    const workspaceConfiguration = vscode.workspace.getConfiguration(ConfigurationSectionName);
    const comments: boolean = workspaceConfiguration.get<boolean>("comments", true);
    return {
        comments: comments
    };
}

/**
 * if current editor language is typescript
 * @param document
 * TODO: implement strategy verification (by language)
 */
function isTypeScriptDocument(document: vscode.TextDocument) {
    return (
        document.languageId === "typescript" ||
        document.languageId === "typescriptreact"
    );
}

/**
 * Generic code replacer for selected code to be transformed
 * @param editor 
 * @param strat 
 * @param out 
 */
function replaceCode(editor: vscode.TextEditor, strat: MomoThePug.ILangCodeGen, out: MomoThePug.Transformable[]) {
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    const code: string = strat.extract(text, out);
    const res = [vscode.TextEdit.replace(
        new vscode.Range(selection.start, selection.end),
        code
    )];
    const edit = new vscode.WorkspaceEdit();
    edit.set(editor.document.uri, res);
    vscode.workspace.applyEdit(edit);
}

export function deactivate() {
}