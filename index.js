'use strict';
const {app, Menu, Tray, BrowserWindow} = require('electron')
const command = require('shelljs/global')
const jquery = require('jquery')
const fs = require('fs')
const path = require('path')
const openLink = require('electron').shell

const trayActive = 'assets/logo/trayIcon.png'
const trayWait = 'assets/logo/trayIconWait.png'

let tray = null
let aboutUs = null

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
	aboutUs.webContents.openDevTools()

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
	}

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
					label: box[index]['name'],
					icon: __dirname+"/assets/logo/"+box[index]['state']+".png",
					submenu: [
					{
						label: "Vagrant Up",
						submenu: [
						{
							label: "Up",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant up")
							}
						}]
					},
					{
						label: "Vagrant Suspend",
						submenu: [
						{
							label: "Suspend",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant suspend")
							}
						}]
					},
					{
						label: "Vagrant Resume",
						submenu: [
						{
							label: "Resume",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant resume")
							}
						}]
					},
					{
						label: "Vagrant Halt",
						submenu: [
						{
							label: "Halt",
							sublabel: index,
							id: box[index]['path'],
							click: function(menuItem) 
							{
								runShell(contextMenu, menuItem, "vagrant halt")								
							}
						}]
					},
					{
						label: "Vagrant Destroy",
						submenu: [
						{
							label: "Destroy",
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
	}

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
	}

	// Run
	vagrantManager()

})
