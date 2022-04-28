// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as cp from 'child_process';

import {
	window, commands, workspace,  OutputChannel, ExtensionContext, ViewColumn, Terminal
} from 'vscode';

interface Script {
	scriptName: string;
	cwd: string | undefined;
	execute(): void;
}

interface Process {
	process: cp.ChildProcess;
	cmd: string;
}


interface CommandArgument {
	fsPath: string;
}

let terminal: Terminal | null = null;
let lastScript: Script | null = null;

const runningProcesses: Map<number, Process> = new Map();

let outputChannel: OutputChannel;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	
	registerCommands(context);

	outputChannel = window.createOutputChannel('agsi');
	context.subscriptions.push(outputChannel);

	window.onDidCloseTerminal((closedTerminal) => {
		if (terminal === closedTerminal) {
			terminal = null;
		}
	});

	
}

// this method is called when your extension is deactivated
export function deactivate() {}


function registerCommands(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand('agsi.ls', runAgsiLs),
		commands.registerCommand('agsi.install', runAgsiInstall),
		commands.registerCommand('agsi.helloWorld', () => {
			window.showInformationMessage('Hello World from agsi!');
		})
	);
}

function runAgsiLs(arg: CommandArgument) {
	let home = process.env.HOME;
	if (typeof home === "undefined") {
       home = '';
	}

	runAgsiCommand('ls',  home);
}

function runAgsiInstall(arg: CommandArgument) {
	let home = process.env.HOME;
	if (typeof home === "undefined") {
       home = '';
	}
	runAgsiCommand('install', home);
}


function runCommand(args: string, cwd: string | undefined): void {

	if (useTerminal()) {
		runCommandInIntegratedTerminal(args, cwd);
	} else {
		outputChannel.clear();
		runCommandInOutputWindow(args, cwd);
	}
}


function runAgsiCommand(command: string,  dir: string) {

	const scriptList: Script[] = [];

	scriptList.push({

		scriptName: command,
		cwd: dir,
		execute(this: Script) {
			let script = this.scriptName;
			// quote the script name, when it contains white space
			if (/\s/g.test(script)) {
				script = `"${script}"`;
			}

			runCommand(command, this.cwd);
		}
	});
	

	if (scriptList.length === 1) {
		scriptList[0].execute();
		return;
	} 
}


function runCommandInOutputWindow(args: string, cwd: string | undefined) {
	const cmd = args;
	const p = cp.exec(cmd, { cwd: cwd, env: process.env });

	runningProcesses.set(p.pid, { process: p, cmd: cmd });

	p.stderr?.on('data', (data: string) => {
		outputChannel.append(data);
	});
	p.stdout?.on('data', (data: string) => {
		outputChannel.append(data);
	});
	p.on('exit', (_code: number, signal: string) => {
		runningProcesses.delete(p.pid);

		if (signal === 'SIGTERM') {
			outputChannel.appendLine('Successfully killed process');
			outputChannel.appendLine('-----------------------');
			outputChannel.appendLine('');
		} else {
			outputChannel.appendLine('-----------------------');
			outputChannel.appendLine('');
		}
	});

	showAgsiOutput();
}

function showAgsiOutput(): void {
	outputChannel.show(ViewColumn.Three);
}

function runCommandInIntegratedTerminal(args: string, cwd: string | undefined): void {

	if (!terminal) {
		terminal = window.createTerminal('agsi');
	}
	terminal.show();
	if (cwd) {
		// Replace single backslash with double backslash.
		const textCwd = cwd.replace(/\\/g, '\\\\');
		terminal.sendText(['cd', `"${textCwd}"`].join(' '));
	}
	terminal.sendText(args);
}


function useTerminal() {
	return workspace.getConfiguration('agsi')['runInTerminal'];
}
