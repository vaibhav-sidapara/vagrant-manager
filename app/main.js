const {app, Menu, Tray, BrowserWindow, ipcMain, shell, nativeImage, dialog, remote} = require('electron')
const i18next = require('i18next')
const Backend = require('i18next-node-fs-backend')

startI18next()

const AppSettings = require('./utils/settings')
const defaultSettings = require('./utils/defaultSettings')
const command = require('shelljs/global')
const jquery = require('jquery')
const shellPath = require('shell-path')
const fs = require('fs')
const path = require('path')
const proc = require('child_process')
process.env.PATH = shellPath.sync();

function getIcon(path_icon) {
    return nativeImage.createFromPath(path_icon).resize({width: 16})
}

const trayActive = getIcon(path.join(__dirname,'assets/logo/trayIcon.png'));
const trayWait = getIcon(path.join(__dirname,'assets/logo/trayIconWait.png'));
const icon = path.join(__dirname,'/assets/logo/windowIcon.png');


let aboutUs = null
let appIcon = null
let aboutWin = null
let tray = null
let settingsWin = null
let settings

global.shared = {
	isNewVersion: false
  }
  
  let shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
	if (appIcon) {
		dialog.showMessageBox({
			buttons: [i18next.t('main.yes')],
			message: 'Already running'
		})
	}
  })
  
  if (shouldQuit) {
	console.log('vagrant-manager is already running.')
	app.quit()
	return
  }


if(process.platform === 'darwin') {
    app.dock.hide();
}

function startI18next () {
	i18next
	  .use(Backend)
	  .init({
		lng: 'en',
		fallbackLng: 'en',
		debug: true,
		backend: {
		  loadPath: `${__dirname}/locales/{{lng}}.json`,
		  jsonIndent: 2
		}
	  }, function (err, t) {
		if (err) {
		  console.log(err.stack)
		}
		if (appIcon) {
		  buildMenu()
		}
	  })
  }
  
  i18next.on('languageChanged', function (lng) {
	if (appIcon) {
	  buildmenu()
	}
  })


  function startPowerMonitoring () {
	const electron = require('electron')
	electron.powerMonitor.on('suspend', () => {
	  console.log('The system is going to sleep')
	})
	electron.powerMonitor.on('resume', () => {
	  console.log('The system is resuming')
	})
  }
  function showAboutWindow () {
	if (aboutWin) {
	  aboutWin.show()
	  return
	}
	const modalPath = `file://${__dirname}/about.html`
	aboutWin = new BrowserWindow({
	  width : 400,
	  height : 600,
	  resizable : false,
		fullscreen : false,
		frame: false,
	  icon : icon,
	  title: i18next.t('main.aboutVM', {version: app.getVersion()})
	})
	aboutWin.loadURL(modalPath)
	aboutWin.on('closed', () => {
	  aboutWin = null
	})
	}
	
function showSettingsWindow () {
  if (settingsWin) {
    settingsWin.show()
    return
  }
  const modalPath = `file://${__dirname}/settings.html`
  settingsWin = new BrowserWindow({
	width : 400,
	height : 600,
	resizable : false,
	fullscreen : false,
	frame: false,
	icon : icon,
    title: i18next.t('main.settings')
  })
  settingsWin.loadURL(modalPath)
  // settingsWin.webContents.openDevTools()
  settingsWin.on('closed', () => {
    settingsWin = null
  })
}

function saveDefaultsFor (array, next) {
  for (let index in array) {
    settings.set(array[index], defaultSettings[array[index]])
  }
}

function boxOptions(note,box,index,path,contextMenu, action)
{
	var text = 	{
					label: note,
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, 'vagrant '+action)
					}
				}
	return text
}

function boxStatus(index,note,box,value) 
{
	var text =   {
					label : note+' : '+box[index][value],
					enabled: false
				}
	return text
}

function errorBox(code,stderr) 
{
	dialog.showMessageBox({
		type: 'error',
		buttons: [i18next.t('main.yes')],
		message: 'Code ' + code,
		detail : stderr
	})
}

function sept() 
{
	var text  = {
					type: "separator"
				}
	return text
}

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function boxDetails(callback)
{
	var box = []
	var path = getUserHome()+'/.vagrant.d/data/machine-index/index'
	try {
    fs.accessSync(path, fs.F_OK);
		fs.readFile(path, 'utf8', function (err, data)
		{
			if (err) throw err
			var jsonData = JSON.parse(data)
			for(var index in jsonData.machines) {
				var short_path = jsonData.machines[index]['vagrantfile_path'];
				short_path = short_path.split('/').reverse().filter((v, i) => {
					return i < 2;
				}).reverse().join('/');
				box.push({
					'short_path': short_path,
					'path' 		: jsonData.machines[index]['vagrantfile_path'],
					'state' 	: jsonData.machines[index]['state'],
					'name' 		: jsonData.machines[index]['extra_data']['box']['name'],
					'provider'	: jsonData.machines[index]['extra_data']['box']['provider'],
				})
			}
	
			return callback(box)
		})
	}	 catch (e) {
   		 errorBox(404,i18next.t('main.missing'))
	}
}

function buildTray() {
	tray = new Tray(trayActive)
	return tray
}

function buildMenu() {
  let menu = []
	tray.setImage(trayActive)
	boxDetails( function(box)
	{
		if (global.shared.isNewVersion) {
			menu.push({
				label: i18next.t('main.downloadLatest'),
				click: function () {
				shell.openExternal('https://github.com/absalomedia/vagrant-manager/releases')
				}
			})
		}

		menu.push(
		{
			label: i18next.t('main.refresh'),
			click: function(menuItem)
			{
				buildMenu()
			}
		},
		sept())

		for(var index in box) {
			menu.push(
			{
				label: box[index]['short_path'],
				icon: getIcon(path.join(__dirname,"/assets/logo/"+box[index]['state']+".png")),
				submenu: [
					{
					label: i18next.t('main.up'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, "vagrant up")
					}
				},
				{
					label: i18next.t('main.provision'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						var cmd = 'up --provision'
						if (box[index]['state'] === 'running') {
							cmd = 'provision'
						} 
						runShell(contextMenu, menuItem, "vagrant "+cmd)
					}
				},					
				{
					label: i18next.t('main.suspend'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, "vagrant suspend")
					}
				},
				{
					label:i18next.t('main.resume'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, "vagrant resume")
					}
				},
				{
					label: i18next.t('main.halt'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, "vagrant halt")
					}
				},
				{
					label: i18next.t('main.update'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, "vagrant plugin update")
					}
				},
				{
					label: i18next.t('main.repair'),
					box: index,
					id: box[index]['path'],
					click: function(menuItem)
					{
						runShell(contextMenu, menuItem, "vagrant plugin repair")
					}
				},										
				{
											label: i18next.t('main.destroy'),
											box: index,
											id: box[index]['path'],
											click: function(menuItem)
											{
													function getDialog() {
															dialog.showMessageBox({
																	type: 'warning',
																	buttons: [i18next.t('main.yes'), i18next.t('main.no')],
																	message: 'Are you sure to destroy this vagrant instance?',
																	cancelId: 1,
																	defaultId: 1
															}, function(response) {
																	if(response === 0) {
																			runShell(contextMenu, menuItem, "vagrant destroy -f")
																	}
															});
													}
													getDialog();
											}
				},
				sept(),
				boxStatus(index,i18next.t('main.box'),box,'name'),
				boxStatus(index,i18next.t('main.provider'),box,'provider'),
				boxStatus(index,i18next.t('main.status'),box,'state')
				]
			})
		}
		menu.push(
		sept(),
		{
			label: i18next.t('main.about'),
			click: function (menuItem)
			{
				showAboutWindow()
			}
		},
		{
			label: i18next.t('main.settings'),
			click: function (menuItem)
			{
				showSettingsWindow()
			}
		},
		{
			label: i18next.t('main.quit'),
			click: function (menuItem)
			{
					app.quit();
			}
		})

		if (process.platform === 'darwin' || process.platform === 'win32') {
			let loginItemSettings = app.getLoginItemSettings()
			let openAtLogin = loginItemSettings.openAtLogin
			menu.push({
				label: i18next.t('main.startAtLogin'),
				type: 'checkbox',
				checked: openAtLogin,
				click: function () {
				app.setLoginItemSettings({openAtLogin: !openAtLogin})
				}
			})
		}

		var contextMenu = Menu.buildFromTemplate(menu)
		tray.setToolTip(i18next.t('main.header'))
		tray.setContextMenu(contextMenu)
		return contextMenu	
	})
}


function runShell(contextMenu, menuItem, command)
{
	tray.setImage(trayWait)
	contextMenu.items[0].enabled = false
	var parentID = +menuItem.box + 2
	contextMenu.items[parentID].enabled = false
	tray.setContextMenu(contextMenu)
	proc.exec('cd '+ menuItem.id + ' && ' + command)
	buildMenu()		
}


app.on('ready', loadSettings)
app.on('ready', buildTray)
app.on('ready', buildMenu)
app.on('ready', startPowerMonitoring)
app.on('window-all-closed', () => {
  // do nothing, so app wont get closed
})

function loadSettings () {
	const dir = app.getPath('userData')
	const settingsFile = `${dir}/config.json`
	settings = new AppSettings(settingsFile)
	i18next.changeLanguage(settings.get('language'))
}

ipcMain.on('save-setting', function (event, key, value) {
  settings.set(key, value)
  settingsWin.webContents.send('renderSettings', settings.data)
  buildMenu()
})

ipcMain.on('update-tray', function (event) {
	buildMenu()
})

ipcMain.on('set-default-settings', function (event, data) {
  const options = {
    type: 'info',
    title: i18next.t('main.resetToDefaults'),
    message: i18next.t('main.areYouSure'),
    buttons: [i18next.t('main.yes'), i18next.t('main.no')]
  }
  dialog.showMessageBox(options, function (index) {
    if (index === 0) {
      saveDefaultsFor(data)
      settingsWin.webContents.send('renderSettings', settings.data)
    }
  })
})

ipcMain.on('send-settings', function (event) {
  settingsWin.webContents.send('renderSettings', settings.data)
})

ipcMain.on('show-debug', function (event) {
  const dir = app.getPath('userData')
  const settingsFile = `${dir}/config.json`
  aboutWin.webContents.send('debugInfo', settingsFile)
})

ipcMain.on('change-language', function (event, language) {
  i18next.changeLanguage(language)
  if (settingsWin) {
    settingsWin.webContents.send('renderSettings', settings.data)
  }
})

