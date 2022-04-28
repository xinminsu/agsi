// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "agsi" is now active!');

	registerCommands(context);

	
}

// this method is called when your extension is deactivated
export function deactivate() {}

function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('agsi.ls', () => {
			vscode.window.showInformationMessage('agsi.ls!');
		}),
		vscode.commands.registerCommand('agsi.install', () => {
			vscode.window.showInformationMessage('agsi.install!');
		}),
		vscode.commands.registerCommand('agsi.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from agsi!');
		})
	);
}
