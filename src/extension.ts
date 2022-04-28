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


let terminal: Terminal | null = null;
let lastScript: Script | null = null;

const runningProcesses: Map<number, Process> = new Map();

let outputChannel: OutputChannel;

let curDir: string;

let installSteps:string[];
installSteps = [
	"git --version",
	"node --version",
    "npm install --global yarn",
    "git clone https://github.com/Agoric/agoric-sdk",
    "cd agoric-sdk",
    "yarn install",
    "yarn build",
    "yarn link-cli ~/bin/agoric",
    "agoric --version"
];

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
		commands.registerCommand('agsi.install', runAgsiInstall)
	);
}

function runAgsiInstall() {
	let home = process.env.HOME;
	if (typeof home === "undefined") {
       home = '';
	}
	curDir = home;

	goHome();

	for (let index in installSteps) {
		runAgsiCommand(installSteps[index], curDir);
	}
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

	if(command.includes('cd')){
		curDir = dir + '/' + command.split(" ",2)[1];
	} else {
		curDir = dir;
	}

	var script: Script = { 
		scriptName: command,
		cwd: curDir, 
		execute(this: Script) {
			let script = this.scriptName;
			// quote the script name, when it contains white space
			if (/\s/g.test(script)) {
				script = `"${script}"`;
			}

			runCommand(command, this.cwd);
		}
	};

	script.execute();
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

function goHome(): void {

	let home = process.env.HOME;
	if (typeof home === "undefined") {
       home = '';
	}

	if (!terminal) {
		terminal = window.createTerminal('agsi');
	}
	terminal.show();

	terminal.sendText('cd ' + home);
}

function runCommandInIntegratedTerminal(args: string, cwd: string | undefined): void {

	if (!terminal) {
		terminal = window.createTerminal('agsi');
	}
	terminal.show();

	terminal.sendText(args);
}


function useTerminal() {
	return workspace.getConfiguration('agsi')['runInTerminal'];
}
