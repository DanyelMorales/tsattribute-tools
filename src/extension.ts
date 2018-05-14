'use strict';

import * as vscode from 'vscode';
import { TypescriptCodeGen } from "./langs/Typescript";
import { MomoThePug } from "./Definitions";

const ConfigurationSectionName = "tsattribute-tools";

/**
 * TODO: read targets from menu
 * TODO: deploy
 */
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.tsattribute-tools', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor && isTypeScriptDocument(editor.document)) {
            replaceCode(editor, TypescriptCodeGen.generator(createExtensionConfiguration()), [MomoThePug.Transformable.GETTER, MomoThePug.Transformable.SETTER, MomoThePug.Transformable.ATTRIBUTE]);
        }
    });
    context.subscriptions.push(disposable);
}

function createExtensionConfiguration(): MomoThePug.ITranspilerConfiguration {
    const workspaceConfiguration = vscode.workspace.getConfiguration(ConfigurationSectionName);
    const comments: boolean = workspaceConfiguration.get("tsattribute-tools.comments", false);
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