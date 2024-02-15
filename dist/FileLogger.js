/**
 * [trello] https://trello.com/c/n2xuU0n8
 */
document.addEventListener("deviceready", function() {
	// 沒有 plugin 時不運作 (解決 app 未包含 file plugin 時可能出現的 exception)
	if (!cordova || !cordova.file || !cordova.file.dataDirectory)
		return;
		
	window.FileLogger = (() => {

		/**
		 * 發送log間隔
		 */
		const SEND_LOGGER_DELAY = 10000;

		/**
		 * Log queue
		 */
		let fileLoggerQueue = [];


		function createFile(dirEntry, fileName) {
			return new Promise((resolve, reject) => {
				// Creates a new file or returns the file if it already exists.
				dirEntry.getFile(fileName, { create: true, exclusive: false }, resolve, reject);
			});

		}

		function getFileName() {
			let dat = new Date();
			let yyyy = dat.getFullYear().toString();
			let mm = (dat.getMonth() + 1).toString();
			let dd = dat.getDate().toString();
			return yyyy + '-' +
				(mm[1] ? mm : "0" + mm[0]) + '-' +
				(dd[1] ? dd : "0" + dd[0]) + ".log";
		}

		function writeFile(fileEntry, data, isAppend) {
			// Create a FileWriter object for our FileEntry (log.txt).
			fileEntry.createWriter(function(fileWriter) {

				fileWriter.onwriteend = function() {
				};

				fileWriter.onerror = function(e) {
				};

				// If we are appending data to file, go to the end of the file.
				if (isAppend) {
					try {
						fileWriter.seek(fileWriter.length);
					} catch (error) {
						console.error(error);
					}
				}
				fileWriter.write(data);
			});
		}

		function listFiles(filePath) {
			return new Promise((resolve, reject) => {
				window.resolveLocalFileSystemURL(cordova.file.dataDirectory + filePath,
					function(fileSystem) {
						fileSystem.createReader().readEntries(resolve, reject);
					}, reject);
			});
		}

		async function appendLog(data) {
			let fileName = getFileName();
			let dirPath = cordova.file.dataDirectory + "log/" + fileName.split('.')[0];
			let filePath = dirPath + "/" + fileName;

			await createDirectory("log/" + fileName.split('.')[0]);

			return getFileEntry(filePath)
				.catch(() => {
					return getFileEntry(dirPath)
						.then(dirEntry => {
							return createFile(dirEntry, fileName);
						})

				}).then(fileEntry => {
					// 台灣模式改寫內容 for 解決弱掃問題
					if (window.vue && window.vue.$store.state.config.twMode)
						data = `${new Date().toLocaleTimeString('en-GB')} [Security Issue] Do Not Display Content\r\n`;
					return writeFile(fileEntry, data, true)
				});
		}

		function getFileEntry(filePath) {
			return new Promise((resolve, reject) => {
				window.resolveLocalFileSystemURL(filePath, resolve, reject);
			});
		}

		function isFileExist(filePath) {
			return getFileEntry(cordova.file.dataDirectory + filePath).then(() => {
				return;
			});
		}

		async function createDirectory(filePath) {
			let pathArr = filePath.split("/");
			let dirEntry;
			for (let i = 0; i < pathArr.length; i += 1) {
				let dirName = pathArr[i];
				if (dirName.trim() === "") {
					return Promise.reject({
						"message": "Directory name is empty string."
					});
				}
				dirEntry = await getFileEntry(cordova.file.dataDirectory + pathArr.slice(0, i + 1).join("/"))

					.catch(async function() {
						let fileEntry = await getFileEntry(cordova.file.dataDirectory + pathArr.slice(0, i).join("/"));
						return new Promise((resolve, reject) => {
							fileEntry.getDirectory(dirName, { "create": true }, resolve, reject);
						});

					});
			}
			return dirEntry;
		}

		function deleteFile(filePath) {
			getFileEntry(cordova.file.dataDirectory + filePath).then(function(fileEntry) {
				return new Promise((resolve, reject) => {
					fileEntry.remove(resolve, reject);
				});
			});
		}





		return new class {
			constructor() {
				console.log('FileLogger start');
				this.start();
				this.maxRecord = 7;		// 保留n天記錄
			}

			start() {
				let self = this;
				// 取本機操作記錄
				this.listFiles().then(result=>{
					// 無日誌不處理。
					if(!result.length) return;
					// 依檔名(日期)排序
					result.sort((a,b)=>{
						// 預期檔案及目錄名稱為yyyy-MM-dd
						let _a=Number(a.name.replace(/-/g,'')), _b=Number(b.name.replace(/-/g,''));
						return _b - _a;
					});
					// 檢查舊日誌數量
					for(let i = 0; i < result.length; i++) {
						let fileObj = result[i];
						// 日誌數量大於最大限制時刪除舊的日誌目錄及日誌
						if(i >= self.maxRecord){
							// 移除檔案及目錄
							self.delete(`${fileObj.name}/${fileObj.name}.log`);
							self.delete(`${fileObj.name}`);
						}
					}
				});
				if (typeof window.cordova !== "object" ||
					window.cordova === null ||
					typeof window.cordova.file !== "object" ||
					window.cordova.file === null ||
					typeof window.cordova.file.dataDirectory !== "string") {
					return;
				}
				this.timer = setInterval(function() {
					let tempLog = fileLoggerQueue;
					fileLoggerQueue = [];
					let logStr = tempLog.join("\r\n") + "\r\n";
					appendLog(logStr);
				}, SEND_LOGGER_DELAY);
			}

			stop() {
				clearInterval(this.timer);
			}

			append(str) {
				fileLoggerQueue.push(str);
			}

			listFiles() {
				return listFiles("log");
			}

			mkdir(filePath) {
				return createDirectory(filePath);
			}

			isFileExist(filePath) {
				return isFileExist(filePath);
			}

			delete(fileName) {
				return deleteFile("log/" + fileName);
			}

			read(fileName) {
				if (typeof fileName !== "string") {
					return Promise.reject({
						"message": `Cannot find file[${fileName}]`
					});
				}
				let dirPath = cordova.file.dataDirectory + "log";
				let filePath = dirPath + "/" + fileName;
				return getFileEntry(filePath).then(fileEntry => {
					return new Promise((resolve, reject) => {
						fileEntry.file(function(file) {
							let reader = new FileReader();

							reader.onloadend = function() {
								resolve(this.result);
							};

							reader.readAsText(file);

						}, reject);
					});

				});
			}

		}();

	})();

	function parseArguments(args) {
		let str = "";
		// 支持以第4個參數指定不存資料，改簡易標記 (ex. 總表)
		if (args[3] && args[3].NOT_TO_CLOUD)
			args[2] = "NOT TO LOG DATA"
		for (let i = 0; i < args.length; i += 1) {
			let arg = args[i];
			if (arg == null) {
				arg = '';
			} else if (typeof arg === "object") {
				try {
					arg = JSON.stringify(arg);
				}
				catch (err) {
					arg = '';
				}
			}
			str += arg + (i === args.length - 1 ? "" : "\t");
		}
		return str;
	}

	let log = console.log;
	console.log = (...args) => {
		let str = `${new Date().toLocaleTimeString('en-GB')}\t[INFO]\t${parseArguments(args)}`;
		FileLogger.append(str);
		log.apply(console, args);
	};

	let warn = console.warn;
	console.warn = (...args) => {
		let str = `${new Date().toLocaleTimeString('en-GB')}\t[WARN]\t${parseArguments(args)}`;
		FileLogger.append(str);
		warn.apply(console, args);
	};
	let error = console.error;
	console.error = (...args) => {
		let str = `${new Date().toLocaleTimeString('en-GB')}\t[ERROR]\t${parseArguments(args)}`;
		FileLogger.append(str);
		error.apply(console, args);
	};
}, false);