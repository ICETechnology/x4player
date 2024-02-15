export default {
	data() {
		return {
            pickImageList:[],
        }
	},
    methods: {
        pickImage() {
			// 因2.61.5APP還沒引入resolveLocalFileSystemURL函式，所以做這個判斷
			if(typeof window.resolveLocalFileSystemURL === 'function'){
				this.getImageWithPath();
			}
			else {
				this.getImageAsBase64();
			}
		},
		getImageWithPath() {
			let self = this;
			// 讀檔失敗
			let onErrorLoadFs = (e)=> {
				console.log("onErrorLoadFs", e);
			}
			// 轉換base64
			const toBase64 = file => new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = () => resolve(reader.result);
				reader.onerror = error => reject(error);
			});
			// cordova-plugin-telerik-imagepicker https://www.npmjs.com/package/cordova-plugin-telerik-imagepicker
			window.imagePicker.getPictures(
				function(results) {
					for (var i = 0; i < results.length; i++) {
						let _filePath = results[i];
						console.log("file path", _filePath);
						let fileObj = {
							"name": "",
							"content": "",
						}						
						// resolveLocalFileSystemURL是由george調整不然取得的更新時間會是讀檔時間。
						window.resolveLocalFileSystemURL(_filePath, function (fs) {
							console.log('file system open: ' + fs.name);
							// 預設以手機裡的檔案名稱顯示。
							fileObj.name = fs.name;
							// 取副檔名
							let fileSubName = fs.name.split('.').slice(-1)[0];
							fs.getMetadata((obj)=>{
								console.log('modifytime', obj.modificationTime);
								// 檔案更新時間加副檔名
								fileObj.name = `handset_${new Date(obj.modificationTime).dayTime18().replaceAll('/', '-')}.${fileSubName}`;
								console.log(fileObj.name);
							}, (e)=>{
								console.log('getMetadata error', e);
							});
							// 讀檔並轉成base64。
							fs.file(async (_file)=> {
								console.log("_file.lastModified", _file.lastModified);  
								fileObj.content = await toBase64(_file);
								self.pickImageList.push(fileObj);
								// console.log('file base64: ', fileBs64Ctn);
							});
						}, onErrorLoadFs);
					}
				}, function (error) {
					console.log('Error: ' + error);
				}, {
					// 限制圖片寬度至 375px
					width: 375,
					// 指定 output 類型為 base64 string, 不指定是回傳檔案路徑
					// outputType: 1,
				}
			);
		},
		// 直接讀檔轉換為base64
		getImageAsBase64() {
			let self = this;
			// cordova-plugin-telerik-imagepicker https://www.npmjs.com/package/cordova-plugin-telerik-imagepicker
			window.imagePicker.getPictures(
				function(results) {
					for (var i = 0; i < results.length; i++) {
						// 取圖檔資料中沒有base64的表頭，所以另外加。
						let fileData = "data:image/png;base64," + results[i];
						let fileObj = {
							"name": `handset_${Date.now()}`,
							"content": fileData,
						}
						self.pickImageList.push(fileObj);
					}
				}, function (error) {
					console.log('Error: ' + error);
				}, {
					// 限制圖片寬度至 375px
					width: 375,
					// 指定 output 類型為 base64 string
					outputType: 1,
			});
		},
    },
    watch: {
       
    },
}