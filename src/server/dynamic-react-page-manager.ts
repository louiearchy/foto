
import fs from "node:fs"
import child_process from "node:child_process"
import path from "node:path"
import { once, EventEmitter } from "node:events"
import fsPromise from "node:fs/promises"

type Path = string
type Date = number

enum CompilationResult {
    Success,
    ErrorOccurred
}

interface WatchFileEntry {
    filepath: Path
    dateModified: Date
}

interface ProcessResult {
    stdout: string
    exitcode: number
}

function GetFileDateModified(pathToFile: Path): Date {
    return fs.statSync(pathToFile).mtimeMs
}

async function RunShell(command: string): Promise<ProcessResult> {
    let runShellEvent = new EventEmitter()
    let shellProcess = child_process.exec(command)
    let stdoutData = ""
    shellProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString()
    })
    shellProcess.on('exit', () => {
        runShellEvent.emit('exit')
    })
    
    await once(runShellEvent, 'exit')
    return {
        stdout: stdoutData,
        exitcode: shellProcess.exitCode
    }
}

type WatchFileEntries = WatchFileEntry[]

/**
 * DynamicReactPageManager is used to manage react pages compilation and
 * serving.
 */
export default class DynamicReactPageManager {

    /**
     * watchFilePath pertains to the path of a watch file (in json format)
     * in which the DynamicPageManager uses to store information (filepath, date modified) 
     * of all the files it needs to watch 
     */
    protected watchFilePath: Path

    /**
     * The directory that the compiled pages would be stored in
     */
    protected compiledPagesDirectoryPath: Path

    /**
     * The in-memory collection of watch file entries that the DynamicPageManager
     * uses to store information (filepath, date modified) of all the files it needs to
     * watch, the records here are also written to a file specified by watchFilePath for
     * safekeeping
     */
    protected watchFileEntries: WatchFileEntries


    constructor(watchFilePath: Path, compiledPagesDirectoryPath: Path) {
        this.watchFilePath = watchFilePath
        this.compiledPagesDirectoryPath = compiledPagesDirectoryPath
        
        if (this.IsWithWatchFile()) {
            this.PreparePreviousWatchFileEntries()
        }
        else {
            this.watchFileEntries = []
        }


        if (!this.DoesCompiledPagesDirectoryExists)
            fs.mkdirSync(this.compiledPagesDirectoryPath, { recursive: true });

    }

    protected IsWithWatchFile() {
        return fs.existsSync(this.watchFilePath)
    }

    protected PreparePreviousWatchFileEntries() {
        let watchFileData = fs.readFileSync(this.watchFilePath).toString("utf-8")
        let watchFileDataInJSONFormat = JSON.parse(watchFileData)
        this.watchFileEntries = watchFileDataInJSONFormat
    }

    protected DoesCompiledPagesDirectoryExists() {
        return fs.existsSync(this.compiledPagesDirectoryPath)
    }

    /**
     * Checks whether the page file has been changed or is new
     */
    protected IsPageFileChanged(pathToPageFile: Path): boolean {
        if (this.watchFileEntries.length == 0)
            return true;
        else {
            for ( 
                let i = 0;
                i < this.watchFileEntries.length;
                i++
            )
            {
                let currentWatchFileEntry = this.watchFileEntries[i]
                if (currentWatchFileEntry.filepath == pathToPageFile) {
                    return currentWatchFileEntry.dateModified != GetFileDateModified(pathToPageFile)
                }
            }
            return true
        }
    }

    /**
     * 
     * This function is used to remove import statements of react and react-dom/client from
     * the compiled page files because of conflicting requirements and outputs in the browser 
     * and the TypeScript compilation. 
     * 
     * We made our output file as ESModule (which uses import statements), which would mean
     * that the import statements of react and react-dom would be included in the output file,
     * however including the said import statements would have the following problems:
     * 
     * 1. We cannot use the "react" and "react-dom" as url specifiers in the import statement
     * in the browser as it is required to be an absolute path meaning it must be like this "./react"
     * and "./react-dom"
     * 
     * 2. But then if we use absolute path, we cannot compile our react page file as these imported 
     * files would be declared missing
     * 
     * 3. the react and react-dom scripts are not in an ESModule format but rather in a UMD format, 
     * meaning we cannot really use import statements in the output file
     * 
     * 
     * @param pathToCompiledPageFile 
     */
    protected async RemoveReactImportStatements(pathToCompiledPageFile: Path): Promise<void> {
        let compiledPageData = (await fsPromise.readFile(pathToCompiledPageFile)).toString("utf-8")
        let compiledPageDataPerLine = compiledPageData.split('\n')
        let newCompiledPageData = ""
        for (let i = 0; i < compiledPageDataPerLine.length; i++) {
            let currentLine = compiledPageDataPerLine[i]
            let currentLineSplitted = currentLine.split(" ")
            if (currentLineSplitted.includes("import") && 
                (
                    currentLineSplitted.includes("ReactDOM") || 
                    currentLineSplitted.includes("React")    ||
                    currentLineSplitted.includes("react")    ||
                    currentLineSplitted.includes("react-dom/client") ||
                    currentLineSplitted.includes("ReactRouterDOM") ||
                    currentLineSplitted.includes("react-router-dom") ||
                    currentLineSplitted.includes("jquery")
                )
            )
            {
                continue;
            }
            else {
                newCompiledPageData += currentLine
                if (i < compiledPageDataPerLine.length - 1) {
                    newCompiledPageData += '\n'
                }
            }
        }
        await fsPromise.writeFile(pathToCompiledPageFile, newCompiledPageData)
        return Promise.resolve()
    }

    protected GetPathToCompiledFile(pathToPageFile: Path): Path {
        let isPathWindowStyle = pathToPageFile.indexOf("\\") != -1
        let pathSeparator = (isPathWindowStyle) ? '\\' : '/'
        let filename = pathToPageFile.split(pathSeparator).reverse()[0].replace(".tsx", ".js")
        return path.join(this.compiledPagesDirectoryPath, filename)
    }

    protected async CompileFile(pathToPageFile: Path): Promise<CompilationResult> {
        let command = `npx tsc ${pathToPageFile} --jsx react --outDir ${this.compiledPagesDirectoryPath}`
        command += ` --allowSyntheticDefaultImports --target ES6 --module ES6 --moduleResolution node`
        let process = await RunShell(command)
        if (process.exitcode != 0) {
            console.log(process.stdout)
            return CompilationResult.ErrorOccurred
        }
        else {
            await this.RemoveReactImportStatements(this.GetPathToCompiledFile(pathToPageFile))
            return CompilationResult.Success
        }
    }

    protected RecordWatchFileEntry(pathToPageFile: Path) {
        if (this.watchFileEntries.length == 0) {
            this.watchFileEntries.push({
                filepath: pathToPageFile,
                dateModified: GetFileDateModified(pathToPageFile)
            })
        }
        else {
            for (
                let i = 0;
                i < this.watchFileEntries.length;
                i++
            ) {
                let currentWatchFileEntry = this.watchFileEntries[i]
                if (currentWatchFileEntry.filepath == pathToPageFile) {
                    currentWatchFileEntry.dateModified = GetFileDateModified(pathToPageFile)
                    return
                }
            }
            // reaching this point would mean that the page file is new
            this.watchFileEntries.push({
                filepath: pathToPageFile,
                dateModified: GetFileDateModified(pathToPageFile)
            })
        }
    }

    protected GetPageFile(pathToPageFile: Path): Buffer | undefined {
        let pathToCompiledPageFile = this.GetPathToCompiledFile(pathToPageFile)
        if (fs.existsSync(pathToCompiledPageFile)) {
            return fs.readFileSync(pathToCompiledPageFile)
        }
        else {
            return undefined
        }
    }

    public async GetPage(pathToPageFile: Path): Promise<Buffer | undefined> {
        if (this.IsPageFileChanged(pathToPageFile)) {
            console.log(`compiling ${pathToPageFile}...`)
            let compilationResult = await this.CompileFile(pathToPageFile)
            if (compilationResult == CompilationResult.Success) {
                console.log(`compiled ${pathToPageFile} successfully!`)
                this.RecordWatchFileEntry(pathToPageFile)
                return this.GetPageFile(pathToPageFile)
            }
            else {
                return undefined
            }
        }
        return this.GetPageFile(pathToPageFile)
    }

    /* must be called when the server exits */
    public Save() {
        fs.writeFileSync(
            this.watchFilePath,
            JSON.stringify(this.watchFileEntries)
        )
    }

}