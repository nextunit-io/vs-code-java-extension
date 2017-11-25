export interface Configuration {
    colors: ConfigurationColors;
    directories: ConfigurationDirectories;
}

export interface ConfigurationColors {
    sourceDir: string;
}

export interface ConfigurationDirectories {
    sources: string[];
}