'use strict';
import { JavaViewProvider } from './view/java.view';

// https://github.com/eamodio/vscode-gitlens/blob/master/src/configuration.ts

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Configuration } from './model/configuration';
import { COMMAND_CONFIG, COMMAND_CONFIG_ADD_SOURCE_DIR, EXTENSION_ID, EXTENSION_NAMESPACE, VIEW_JAVA } from './config';
import * as vscode from 'vscode';
import { JavaConfigCommand } from './commands/java-config.command';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "java-overview-extension" is now active!');
    console.log(vscode.workspace.rootPath);
    // COMMANDS
    (new JavaConfigCommand()).activate(context);

    // VIEwS
    context.subscriptions.push(vscode.window.registerTreeDataProvider(VIEW_JAVA, new JavaViewProvider()));
}

// this method is called when your extension is deactivated
export function deactivate() {
}