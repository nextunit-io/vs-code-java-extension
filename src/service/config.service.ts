import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { Configuration } from '../model/configuration';
import { EXTENSION_ID, VS_CODE_FOLDER, EXTENSION_NAMESPACE } from '../config';

const defaultModel = {
    colors: {
        sourceDir: '#00F'
    },
    directories: {
        sources: []
    }
};

export class ConfigService {
    public saveConfig(fileUri: vscode.Uri, data: Configuration): Promise<any> {
        return this.getConfigPath(fileUri).then((path) => {
            return fs.outputJson(path, data, {
                spaces: 4
            });
        });
    }

    private createDefaultConfig(path?: vscode.Uri): Promise<Configuration> {
        return this.getConfigPath(path).then((configPath) => {
            return fs.ensureDir(configPath.replace(`/${EXTENSION_ID}.json`, '')).then(() => configPath);
        }).then((configPath) => {
            return this.saveConfig(configPath, defaultModel);
        }).then(() => {
            return defaultModel;  
        });
    }

    public getConfig(path?: vscode.Uri, createDefaultConfig: boolean = false): Promise<Configuration> {
        return this.getConfigPath(path).then((configPath: string) => {
            return new Promise((resolve, reject) => {
                if (!fs.existsSync(configPath)) {
                    if (!createDefaultConfig) {
                        reject('No configuration available');
                    } else {
                        return this.createDefaultConfig(path);
                    }
                }

                fs.readJson(configPath).then(resolve).catch(reject);
            });
        }).then((config: Configuration) => config);
    }

    public getConfigPath(path?: vscode.Uri): Promise<string> {
        return this.getVsCodeConfigPath().then(vsCodeConfigPath => {
            return `${vsCodeConfigPath.fsPath}/${VS_CODE_FOLDER}/${EXTENSION_NAMESPACE}/${EXTENSION_ID}.json`;
        });
    }

    private getVsCodeConfigPath(path?: vscode.Uri): Promise<vscode.Uri> {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return Promise.reject('No workspace folders available.');
        }

        if (vscode.workspace.workspaceFolders.length === 1) {
            return Promise.resolve(vscode.workspace.workspaceFolders[0].uri);
        }

        if (path) {
            return new Promise((resolve, reject) => {
                let workspaceList = vscode.workspace.workspaceFolders.filter((directory) => {
                    return path.fsPath.startsWith(directory.uri.fsPath);
                });

                if (workspaceList.length === 1) {
                    resolve(workspaceList[0].uri);
                } else {
                    reject('Can not resolve workspace path');
                }
            });
        } else {
            const workspaces = vscode.workspace.workspaceFolders.map((directory) => {
                return {
                    value: directory.uri,
                    label: directory.name,
                    description: directory.uri.fsPath
                };
            });
    
            return new Promise((resolve, reject) => {
                vscode.window.showQuickPick(workspaces, {
                    ignoreFocusOut: true,
                    placeHolder: 'Select your workspace: (ESC to exit)'
                }).then(selection => {
                    if (!selection) {
                        reject('No item selected');
                    } else {
                        resolve(selection.value);
                    }
                })
            });
        }
    }

    public getRelativeToWorkspaces(uri: vscode.Uri): Promise<string> {
        console.log(uri);
        return this.getVsCodeConfigPath(uri).then((vsCodePath) => {
            return uri.path.replace(vsCodePath.path, '');
        });
    }

    public getAbsolutPaths(uri: string): Promise<string> {
        return this.getVsCodeConfigPath({
            uri
        })
    }
}