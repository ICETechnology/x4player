<template>
	<div class="local-operator-record-ctn flex-col">
		<div class="setting-line flex-start">{{$ln("系统运行日志")}}</div>
		<div class="record-select-ctn setting-line flex-row flex-start">
			<SingleSelect :options="recordList" v-model="recordFileName" class="w100p"/>
			<Button class="mgl2 ht1 rd6 pdlr5 font-size-little upload-btn nowrap" @click="onRecordUpload" >{{$ln('上传')}}</Button>
		</div>
		<div class="setting-line flex-start">{{$ln("请选择问题发生当日的运行日志")}}</div>
		<!-- 上傳檔案的遮罩 -->
		<div class="upload-mask flex-center flex-col" v-if="showMask">
			<span>{{`${recordFileName} ${$ln("日志上传中。。。")}`}}</span>
			<div class="process-bar background-animate h5vw w80vw rd3 mgt2" />
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {
			recordFileName: "",
			recordList:[],
			status: {},
			cacheDirectory: "",
		}
	},
	beforeMount() {
		let self = this;
		try {
			// 取本機操作記錄
			FileLogger.listFiles().then(result=>{
				// 依檔名(日期)排序
				result.sort((a,b)=>{
					// 預期檔案及目錄名稱為yyyy-MM-dd
					let _a=Number(a.name.replaceAll('-', '')), _b=Number(b.name.replaceAll('-', ''));
					return _b - _a;
				});
				// 建立清單
				for(let i = 0; i < FileLogger.maxRecord; i++) {
					let fileObj = result[i];
					if(!fileObj) break;	// 沒資料就結束
					// 建立日誌清單
					this.recordList.push({label: fileObj.name, value: fileObj.name, data: fileObj});
				}
			});
		} catch(e) {
			// 不是因為沒有FileLogger所產生的問題。
			if(window.FileLogger)
				console.error("get local operator log fail", e);
		}
		// 暫存目錄
		this.cacheDirectory = `${window.cordova? cordova.file.cacheDirectory: ''}`;
	},
	mounted() {},
	methods: {
		/** 系統運行日誌上傳 */
		onRecordUpload() {
			if(!this.isActive) return;
			// 跟AC要一個一次性token
			M4C.AC.getAcToken(1);
			// 壓縮日誌(沒有zeep及filelogger不執行)
			this.zipFile();
		},
		/** 執行上傳 */
		doUpload() {
			// 設定上傳資料
			let issueData = {title: `${this.traderID || ''}${this.recordFileName}${this.$ln('系统运行日志上传')}`, desc: `${this.$ln('系统运行日志上传...')}`};
			let fileObj = {"name": `${this.recordFileName}.zip`,"content": "",};
			let _filePath = `${this.cacheDirectory}${this.recordFileName}.zip`;
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
			// 讀取檔案
			window.resolveLocalFileSystemURL(_filePath, function (fs) {
				console.log('file system open: ' + fs.name);
				// 讀檔並轉成base64。
				fs.file(async (_file)=> { 
					fileObj.content = await toBase64(_file);
				});
			}, onErrorLoadFs);
			// console.log('issueData', issueData);
			// console.log('attachedFileObj', fileObj);
			// 透過問題回報上傳操作記錄
			this.status = M4C.Issue.submitIssue(issueData, [fileObj], {noNotify: true});
		},
		// 壓縮檔案 (https://github.com/FortuneN/cordova-plugin-zeep)
		zipFile() {
			// 檔案所在的目錄
			let source    = `${cordova.file.dataDirectory}log/${this.recordFileName}`; 				//cordova.file.applicationDirectory,
			// 輸出的位置及檔名
			let zip       = `${this.cacheDirectory}${this.recordFileName}.zip`;  					//cordova.file.cacheDirectory + 'source.zip';
			// console.log('source    : ' + source   );
			// console.log('zip       : ' + zip      );
			console.log('zipping ...');
			let self = this;
			Zeep.zip({
				from : source,
				to   : zip
			}, function() {
				console.log('zip success!');
				self.doUpload();
			}, function(e) {
				console.log('zip error: ', e);
			});
		},
	},
	watch: {
		uploadStatus(nv, ov) {
			let self = this;
			// 檔案上傳成功
			if(nv === 'UPLOAD_FILE_SUCCESS'){
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `上传成功！`,
					content: self.$ln(`您的日志已经上传成功！`),
					confirmOnly: true,
					confirm: () => {
						// 移除核心中暫存的資料
						delete M4C.Issue.sendMap[self.status.key];
					}
				});
			}
			// 檔案上傳失敗 or 卡片建立失敗
			else if (nv === 'UPLOAD_FILE_FAIL' || nv === 'UPLOAD_FAIL' || nv==="SUBMIT_ISSUE_FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `上传失败！`,
					content: self.$ln(`您的日志上传失败，请稍後再试。`),
					confirmOnly: true,
					confirm: () => {
						// 移除核心中暫存的資料
						delete M4C.Issue.sendMap[self.status.key];
					}
				});
			}
		}
	},
	computed: {
		// 已選取日誌
		selectedLog() {
			return this.recordList.find(red=> (red.value === this.recordFileName));
		},
		// 當前交易帳號
		traderID() {
			return this.$store.state.selectedBTO.traderID;
		},
		// 上傳狀態
		uploadStatus() {return this.status.status;},
		// 上傳時的遮罩
		showMask() {
			let _status = this.uploadStatus || "NONE";
			switch(_status){
				// 未上傳
				case "NONE":
				// 建立卡片失敗
				case "SUBMIT_ISSUE_FAIL":
				// 上傳成功
				case "UPLOAD_FILE_SUCCESS":
				// 上傳失敗
				case "UPLOAD_FILE_FAIL":
				case "UPLOAD_FAIL":
					return false;
				default:
					return true;
			}
		},
		// 判斷是否可作用
		isActive() {
			// 有壓縮plugin、有日誌記錄功能、有選取日誌
			return window.Zeep && window.FileLogger;
		},
	}
}
</script>
<style scoped>
.upload-mask{
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background-color:rgba(0,0,0,0.8);
	opacity: 0.8;
	z-index: 1;
}
</style>