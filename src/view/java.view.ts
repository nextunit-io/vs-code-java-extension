import { ConfigService } from '../service/config.service';
import { JAVA_IGNORE_FILES } from '../config';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { JavaConfigCommand } from '../commands/java-config.command';

export class JavaViewProvider implements vscode.TreeDataProvider<JavaViewItem> {
    public onDidChangeTreeData?: vscode.Event<JavaViewItem>;

    private configService: ConfigService;

    constructor() {
        this.configService = new ConfigService();
    }

    public getTreeItem(element: JavaViewItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(element?: JavaViewItem): vscode.ProviderResult<JavaViewItem[]> {
        return new Promise((resolve) => {
            if (element) {
                this.getDirectory(element.fileUri, element.workspace).then(resolve);
            } else {
                if (vscode.workspace.workspaceFolders.length === 1) {
                    this.getDirectory(vscode.workspace.workspaceFolders[0].uri.fsPath, vscode.workspace.workspaceFolders[0]).then(resolve);
                } else {
                    let childs = [];
                    vscode.workspace.workspaceFolders.forEach((workspace) => {
                        childs.push(new JavaViewItem(workspace.name, vscode.TreeItemCollapsibleState.Collapsed, workspace.uri.path, workspace, false, true));
                    });
                }
            }
        });
    }

    private getDirectory(path: string, workspace: vscode.WorkspaceFolder): Promise<JavaViewItem[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(path, (err, files) => {
                if (err) {
                    reject(err);
                }

                let childs = [];
                files.forEach(file => {
                    if (JAVA_IGNORE_FILES.indexOf(file) === -1) {
                        let filePath = `${path}/${file}`;
                        let isDir = fs.lstatSync(filePath).isDirectory();
                        childs.push(new JavaViewItem(file, isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, filePath, workspace, isDir, false));
                    }
                });

                this.extendChilds(childs).then((extendedChilds) => {
                    extendedChilds.sort((a: JavaViewItem, b: JavaViewItem) => {
                        if (a.isDirectory && !b.isDirectory) {
                            return -1;
                        }
                        if (!a.isDirectory && b.isDirectory) {
                            return 1;
                        }

                        if (a.label < b.label) {
                            return -1;
                        }
                        if (a.label > b.label) {
                            return 1;
                        }

                        return 0;
                    });

                    resolve(extendedChilds);
                });
            });
        });
    }

    private extendChilds(childs: JavaViewItem[]): Promise<JavaViewItem[]> {
        return Promise.all(childs.map(child => {
            if (!child.isDirectory) {
                return Promise.resolve(child);
            }

            return this.configService.getConfig(vscode.Uri.file(child.fileUri)).then(config => {
                let checks = {
                    extended: false,
                    sourceDir: false
                }
                let sourceFolder = false;
                let filePath = child.fileUri.replace(child.workspace.uri.fsPath, '').replace('\\', '/');

                config.directories.sources.forEach(path => {
                    if (filePath === path) {
                        checks.sourceDir = true;
                    } else if (filePath.startsWith(path)) {
                        checks.extended = true;
                    }
                });

                if (checks.sourceDir) {
                    child.options.sourceFolder = true;
                }

                if (checks.extended) {
                    return this.getExtendedChild(child);
                } else {
                    return child;
                }
            });
        }));
    }

    private getExtendedChild(child: JavaViewItem): Promise<JavaViewItem> {
        return new Promise(resolve => {
            fs.readdir(child.fileUri, (err, files) => {
                console.log(err, files);
                if (err || !files || typeof files === 'undefined' || files.length !== 1) {
                    resolve(child);
                    return;
                }

                let filePath = `${child.fileUri}/${files[0]}`;
                let isDir = fs.lstatSync(filePath).isDirectory();

                if (!isDir) {
                    resolve(child);
                }

                this.getExtendedChild(new JavaViewItem(
                    `${child.label}.${files[0]}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    filePath,
                    child.workspace,
                    true,
                    false
                )).then(resolve);
            });
        });
    }
}

class JavaViewItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly fileUri: string,
        public readonly workspace: vscode.WorkspaceFolder,
        public readonly isDirectory: boolean,
        public readonly isWorkspace: boolean,
        public options: {
            sourceFolder: boolean
        } = {
            sourceFolder: false
        }
    ) {
        super(label, collapsibleState);
    }
}