'use strict';
const {app, Menu, Tray, BrowserWindow} = require('electron');
const command = require('shelljs/global');
const jquery = require('jquery');
const fs = require('fs');
const path = require('path');
const openLink = require('electron').shell;

// const terminal = require('child_process');

const trayActive = 'assets/logo/trayIcon.png';
const trayWait = 'assets/logo/trayIconWait.png';

let tray = null;
let aboutUs = null;

app.on('ready', () => 
{
	tray = new Tray(path.join(__dirname, trayActive))
	aboutUs = new BrowserWindow({
		width : 400,
		height : 600,
		resizable : false,
		fullscreen : false,
		title : 'About | Vagrant Manager',
		icon : __dirname+'/assets/logo/windowIcon.png',
		show : false,
	})
	aboutUs.setMenu(null)
	aboutUs.loadURL('file:\/\/'+__dirname+'/about.html')
	// aboutUs.webContents.openDevTools()

	aboutUs.webContents.on('new-window', function(e, url) {
  		e.preventDefault()
  		openLink.openExternal(url)
	})

	function boxDetails(callback) 
	{
		var getFile = exec('cd ~ && pwd', {silent:true,async:true})
		getFile.stdout.on('data', function(data) 
		{
			var box = []
			fs.readFile(data.trim()+'/.vagrant.d/data/machine-index/index', 'utf8', function (err, data) 
			{
				if (err) throw err
				var jsonData = JSON.parse(data)
				for(var index in jsonData.machines) {

					box.push({
						'path' 		: jsonData.machines[index]['vagrantfile_path'],
						'state' 	: jsonData.machines[index]['state'],
						'name' 		: jsonData.machines[index]['extra_data']['box']['name'],
						'provider'	: jsonData.machines[index]['extra_data']['box']['provider'],
					})
				}

				return callback(box)
			})
		})
	};

	var vagrantManager = function(event) 
	{
		tray.setImage(path.join(__dirname, trayActive))
		
		boxDetails( function(box) 
		{
			var menu = [
			{
				label: "Refresh",
				click: function(menuItem)
				{
					vagrantManager()
				}
			},
			{
				type: "separator"
			}]
			
			for(var index in box) {
				menu.push(
				{	
					label: box[index]['path'],
					icon: __dirname+"/assets/logo/"+box[index]['state']+".png",
					submenu: [
					{
						label: "Vagrant ssh",
						id: box[index]['path'],
						click: function(menuItem) 
							{
								openTermWithCmd(menuItem)
							},
						enabled: false
					},
					{
						type: "separator"
					},
					{
						label: "Commands",
						submenu: [
						{
							label: "Up",
							icon: __dirname+"/assets/logo/running.png",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant up")
							}
						},
						{
							label: "Suspend",
							icon: __dirname+"/assets/logo/saved.png",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant suspend")
							}
						},
						{
							type: "separator"
						},
						{
							label: "Resume",
							icon: __dirname+"/assets/logo/running.png",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant resume")
							}
						},
						{
							label: "Halt",
							icon: __dirname+"/assets/logo/poweroff.png",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant halt")								
							}
						},
						{
							label: "Destroy",
							icon: __dirname+"/assets/logo/poweroff.png",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant destroy")
							}
						}]
					},
					{
						type: "separator"
					},
					{
						label : "Box: "+box[index]['name'],
						enabled: false
					},
					{
						label : "Provider: "+box[index]['provider'],
						enabled: false
					},
					{
						label: "Status: "+box[index]['state'],
						enabled: false
					}
					]
				})
			}
			menu.push(
			{
				type: "separator"
			},
			{
				label: 'About',
				click: function (menuItem) 
				{
					aboutUs.show()

					aboutUs.on('close', function (e) 
					{
						e.preventDefault()
						aboutUs.hide() 
						aboutUs.removeAllListeners('close')
					})
				}
			},
			{
				label: "Quit",
				role: 'quit'
			})
			
			var contextMenu = Menu.buildFromTemplate(menu)
			tray.setToolTip('Vagrant Manager')
	  		tray.setContextMenu(contextMenu)
		})
	};

	let runShell = function(contextMenu, menuItem, command)
	{
		tray.setImage(path.join(__dirname, trayWait))
		contextMenu.items[0].enabled = false
		var parentID = +menuItem.sublabel + 2
		contextMenu.items[parentID].enabled = false
		tray.setContextMenu(contextMenu)
		
		let shellCommand = new exec('cd ' + menuItem.id + ' && '+ command, function(code, stdout, stderr)
		{
			console.log('Exit code:', code)
			console.log('Program output:', stdout)
			console.log('Program stderr:', stderr)

			vagrantManager()
		})
	};

	let openTermWithCmd = function(menuItem){
		//Open terminal in that folder
		console.log("TODO :P");
		//terminal.exec('x-terminal-emulator');
	};

	// Run
	vagrantManager()

})
