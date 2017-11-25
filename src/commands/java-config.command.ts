import { ConfigService } from '../service/config.service';
import { relative } from 'path';
import { print } from 'util';
import { resolve } from 'url';
import * as vscode from 'vscode';
import * as jsonfile from 'jsonfile';
import * as fs from 'fs-extra';
import { Configuration } from '../model/configuration';
import { EXTENSION_ID, EXTENSION_NAMESPACE, COMMAND_CONFIG_ADD_SOURCE_DIR, VS_CODE_FOLDER } from '../config';
import { workspace } from 'vscode';

export class JavaConfigCommand {
    private configService: ConfigService;

    constructor() {
        this.configService = new ConfigService();
    }

    public activate(context: vscode.ExtensionContext): any {
        let c = vscode.commands.registerCommand(COMMAND_CONFIG_ADD_SOURCE_DIR, (fileUri: vscode.Uri) => { return this.addSourceDirectory(fileUri); });
        context.subscriptions.push(c);
    }

    public addSourceDirectory(fileUri: vscode.Uri): any {
        console.log(fileUri);
        return this.configService.getConfig(fileUri, true).then((config: Configuration) => {
            return this.configService.getRelativeToWorkspaces(fileUri).then((relativePath) => {
                return { config, relativePath }
            })
        }).then(({ config, relativePath }) => {
            if (config.directories.sources.indexOf(relativePath) !== -1) {
                vscode.window.showErrorMessage(`The path '${relativePath}' is already a source path.`);
            } else {
                config.directories.sources.push(relativePath);
                return this.configService.saveConfig(fileUri, config).then(() => {
                    vscode.window.showInformationMessage(`The relative path '${relativePath}' successfully added.`)
                });
            }
        }).catch(err => {
            vscode.window.showErrorMessage(err);  
        });
    }
}