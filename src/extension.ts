'use strict';

import * as vscode from 'vscode';
import { TypescriptCodeGen } from "./langs/Typescript";
import { MomoThePug } from "./Definitions";

/**
 * TODO: read targets from menu
 * TODO: read configuration from vscode config 
 * TODO: deploy
 */
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.tsattributeTools', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor && isTypeScriptDocument(editor.document)) {
            replaceCode(editor, TypescriptCodeGen.generator(), [MomoThePug.Transformable.GETTER, MomoThePug.Transformable.SETTER, MomoThePug.Transformable.ATTRIBUTE]);
        }
    });
    context.subscriptions.push(disposable);
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