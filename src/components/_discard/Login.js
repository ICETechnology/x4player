import Agree from "@/components/Agree.vue"
import Password from "@/components/Password.vue"
import PatternLock from 'patternlock';
import 'patternlock/dist/patternlock.css';

export default {
	props: [],
	data: function () {
		let pid = this.$store.state.config.projectID;
		return {
			pid: pid,
			/** 輸入帳號 */
			inputUser: urlParam.usr || localStorage.getItem(pid + '_LOGIN_USER') || '',
			/** 輸入密碼 */
			inputPswd: urlParam.pwd || '',
			/** Loading-Icon */
			isLoading: false,
			/** 最下方顯示文字 */
			message: '',
			/** 當前所選擇的 Host (DEV/HK) : URL指定 > 最後記憶 > config.path.js 指定 > "DEV"  */
			selectedHost: urlParam.env || localStorage.getItem(pid + '_LOGIN_HOST') || window.$path.LOGIN_HOST || 'DEV',
			/** 自動登入 */
			autoLogin: localStorage.getItem(pid + '_AUTO_LOGIN') == "true",
			dialogList: [],
			/** 是否顯示選擇連線主機 */
			displayHost: false,
			/** 是否顯示手勢鎖登入 */
			showPattern: false,
			comfirmData: {},
		}
	},
	beforeMount: function() {
		let self = this;
		this.message = `${this.sourceFrom} : ${window._version.v}`;

		// 彈出視窗
		eventBus.$on("LOGIN-POPUP-DIALOG", (componentClass, param)=>{
			self.dialogList.push({'cls': componentClass, 'param': param});
			// 利用 pushState 讓 Android 的 BackButton 可關閉彈出視窗
			if (this.$store.state.device.isAndroid) {
				history.pushState({}, '');
			}
		});
		// 關閉視窗
		eventBus.$on("LOGIN-CLOSE-DIALOG", ()=>{
			self.dialogList.pop();
		});
		// 彈出確認視窗
		eventBus.$on("LOGIN-CONFIRM-DIALOG", (param)=>{
			self.comfirmData = param;
		});
		// 關閉確認視窗
		eventBus.$on("LOGIN-CLOSE-CONFIRM", ()=>{
			self.comfirmData = {};
		});
		// 使用者同意書
		eventBus.$on("USER-AGREE", ()=>{
			self.excLogin();
		});

		// 登入手勢鎖
		let enablePatternLock = this.$store.state.config.enablePatternLock;
		let storagePattern = localStorage.getItem(`${this.pid}_PATTERN_LOCK`);
		if (!this.autoLogin && enablePatternLock && storagePattern) {
			this.showPattern = true;
			setTimeout(function(){
				this.lock = new PatternLock("#pattern-lock-ctn", {
					onDraw: function(pattern){
						console.log(`pattern`, pattern);
						if (pattern == storagePattern) {
							this.inputPswd = localStorage.getItem(this.pid + '_LOGIN_PSWD');
							this.excLogin();
						}
						else {
							eventBus.$emit("FLASHMESSAGE", this.$ln("登入手势错误，请重新输入"), {'delay': 1000});
						}
						this.lock.reset();
					}.bind(this)
				});
			}.bind(this), 0);
		}

		// 當前選擇的連線主機
		this.$store.state.config.connectionLoginInfo = 
			this.$store.state.config.CONFIG.CONNECTION_LOGIN_INFO[this.selectedHost];
	},
	mounted() {
		let self = this;
		console.log(`啟動階段耗時 : ${new Date() - window.launchStartTime}ms`);
		// 移除載入主程式畫面 (齒輪畫面)
		let loadingBuildCtn = document.getElementsByClassName('screen-loading-build')[0];
		if (loadingBuildCtn) {
			document.getElementsByTagName("body")[0].removeChild(loadingBuildCtn);
		}
		// 關閉 App 啟動畫面 (SplashScreen)，延遲一點關，以免這邊比齒輪畫面先關掉，會看到一閃而逝的齒輪畫面
		setTimeout(()=>{
			if (navigator && navigator.splashscreen && navigator.splashscreen.hide) {
				navigator.splashscreen.hide();
			}
		}, 200);

		// 自動登入
		if (this.autoLogin) {
			this.inputPswd = localStorage.getItem(this.pid + '_LOGIN_PSWD');
			this.excLogin();
		}
		// 密碼逾期或密碼失效 (ac or trader.login 都會往這邊送)
		eventBus.$on('PASSWORD-INVALID',(data)=>{
			self.onPasswordInvalid(data);
			self.isLoading = false;
		})

		if (this.urlParam.login)
			this.onBtnLogin(true);
	},
	methods: {
		// 點擊登錄
		onBtnLogin(skipAgree) {
			if (!this.inputUser || !this.inputPswd) {
				eventBus.$emit("FLASHMESSAGE", "请输入帐号与密码");
				return;
			}
			// 取同意條款參數
			let agree = localStorage.getItem(`${this.pid}_AGREE_${this.inputUser}_V1`);
			if (!skipAgree && !agree)
				eventBus.$emit('LOGIN-POPUP-DIALOG', Agree, {account:this.inputUser});
			else
				this.excLogin();
		},
		// 執行登入行為
		excLogin(){
			this.message = `${this.$ln('正在进行登录')}...`;
			this.isLoading = true;
			let info =  Object.assign({}, this.$store.state.config.connectionLoginInfo);
			info.project = this.pid;
			info.user = this.inputUser;
			info.pswd = this.inputPswd;
			// 若此專案登入頁有指定 brokerID 時，Company 預設替換為 brokerID
			info.comp = this.brokerID || info.comp;
			// 若 Company 是 IceTech 時，強制換為 ss2/ff (因為 server 歷史因素不好改，所以 client 配合)
			if (info.comp === "IceTech") {
				info.comp = "ss2";
				info.prod = "ff";
			}
            // 此連線是否使用二階段登入方式
            info.login3rd = this.login3rd;			
			// 建立連線並登入
			M4C.connectLogin([info]).then(this.onConnectLoginReady).catch(this.onConnectLoginFail);
		},
		// 點擊訊息文字超過 10 次顯示主機選擇
		onClickMsg() {
			this.clickMsgCnt = this.clickMsgCnt || 0;
			this.displayHost = ++this.clickMsgCnt >= 10 ? true : false;
		},
		onCancelChangePassword(data) {
			let self = this;
			// 密碼過期情境
			if(data.cd === -204 || data.cd == -63) {
				// 延用舊密碼
				M4C.AC.useOldPwd();
				// trader loing 階段
				if(data.cd === -63) {
					setTimeout(() => {
						self.onConnectLoginReady();
					}, 500);
				}
			}
			// 強制修改密碼情境
			else {
				// -203取消直接中斷ws連線
				M4C.disconnect(true);
			}
		},
		/** 密碼逾期 或 密碼已失效 */
		onPasswordInvalid(data){
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				// "AC服務強制修改密碼" or "密碼已逾期"
				content: `${data.d.msg}`,
				confirm: () => {
					// 顯示修改密碼視窗
					eventBus.$emit('LOGIN-POPUP-DIALOG', Password, {
						account:self.inputUser, 
						onSuccessCB: ()=>{
							eventBus.$emit("CONFIRM-DIALOG", {
								content: this.$ln("更新成功，请使用新密码重新登入"),
								confirm: () => {
									// 修改密碼成功後，按確認執行reload
									window.location.reload();
								}
							});
						},
						// 取消
						onCancel: () => {
							self.onCancelChangePassword(data);
							eventBus.$emit("LOGIN-CLOSE-DIALOG");
						},
						// Back icon執行時額外做的動作
						backCB: ()=>{
							M4C.disconnect(true);
						}
					});
				},
				cancel: () => {
					self.onCancelChangePassword(data);
				}
			});
		},
		/** 連線登入失敗 */
		onConnectLoginFail(data) {
			M4C.disconnect(true);
			this.message = `(${data.cd}) ${data.message}`;
			this.isLoading = false;
		},		
	},
	watch: {
		/** 切換連線主機 */
		selectedHost(nv) {
			localStorage.setItem(this.pid + '_LOGIN_HOST', nv);
			// 清除 localStorage 的三表，以免因不同主機之間版本號差異，經過 diff/patch 機制後發生異常
			for (let key in localStorage){
				if (key.indexOf("_SYMBOL_") !== -1)
					localStorage.removeItem(key);
			}
			// 當前選擇的連線主機
			this.$store.state.config.connectionLoginInfo = this.$store.state.config.CONFIG.CONNECTION_LOGIN_INFO[nv];
		},
	},
	components: {
		Agree
	},
	computed: {
		urlParam() {
			return this.$store.state.config.urlParam;
		},
		/** 主程式來源 */
		sourceFrom() {
			let path = this.$store.state.device.path.CLOUD_PATH;
			path = path.split('//')[1] || '';
			path = path.split('/')[0] || '';
			path = path.split('.')[0] || 'version';
			return path;
		},
	}
}