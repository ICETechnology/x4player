<template>
    <div class="flex-center">
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			/** 僅執行一次 (利用這個變數+報價登入成功，來控制啟動後的開始自動登入) */
			executeOnce: true,
			/** 當前登入用的 BTO */
			loginBTO: {},
			alreadyWatch: {},
			unwatchMap: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.LoginTrade = this.$store.state.m4c.loginTrade = this;
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 稍微延遲後開始登入 (由於 brokerMap 是 watch acPdSetting 所產生，延遲以確保取得 brokerMap)
		allAutoLogin() {
			// 間隔 500ms 登入一個帳號，以解決 iOS 上同時呼叫多次穿透式API時可能產生異常的問題
			for (let i = 0; i < this.loginedBTOList.length; i++) {
				setTimeout(({self, bto})=>{
					self.doLogin(bto);
				}, 500*(i+1), {self: this, bto: this.loginedBTOList[i]});
			}
		},
		// 進行登入 (含穿透式資料準備)
		doLogin(bto) {
			let self = this;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			// 重建連線狀態
			let wsConn = M4C.resetWsConn(btID);
			this.$set(wsConn, 'bto', bto);
			this.$set(wsConn, 'connecting', true);
			this.$set(wsConn, '$STATUS', '');

			let brokerInfo = this.getBrokerInfo(bto);
			// 找不到此 broker 時可能是設定已變更等，應清除自動登入記憶
			if (!brokerInfo) {
				M4C.Trader.clearLoginedBTOList(bto.brokerID);
				return;
			}
			// 測試並決定使用哪一台交易主機
			this.prepareHost(bto, brokerInfo, wsConn);
		},
		// 支持多主機競速 (完成後會設定回 brokerInfo.$host 觸發連線)
		prepareHost(bto, brokerInfo, wsConn) {
			let self = this;
			wsConn.$STATUS = this.$ln('正在准备主机位置');
			let prepareHostTimeout = setTimeout(()=>{
				wsConn.$STATUS = this.$ln('无法取得交易主机，请检查网路连线');
				wsConn.connecting = false;
			}, 9998);
			let btID = `${bto.brokerID}|${bto.traderID}`;
			this.$set(brokerInfo, '$host', null);
			// 監聽 brokerInfo.$host 決定要連線哪一台主機
			this.unwatch(btID);
			this.unwatchMap[btID] = this.$watch(()=>{return brokerInfo.$host}, function(nv, ov) {
				clearTimeout(prepareHostTimeout);
				self.unwatch(btID);
				console.log(`[${btID}] M4C.LoginTrade.prepareHost result : `, nv);
				// 開始準備採集資訊
				self.prepareDeviceDigest(bto, brokerInfo, wsConn);
			});
			// 強制指定交易連線主機 (開發測試用)
			if (this.$store.state.config.forceTradeHost)
				brokerInfo.$host = this.$store.state.config.forceTradeHost;
			// brokerInfo 未設定 host 時，使用主程式來源主機
			else if (!brokerInfo.host)
				brokerInfo.$host = this.$host;
			// brokerInfo.host 為字串時，直接使用這台主機
			else if (typeof(brokerInfo.host) === 'string')
				brokerInfo.$host = brokerInfo.host;
			// brokerInfo.host 是陣列時，開始進行競速 (競速結果會寫回 brokerInfo.$host)
			else if (Array.isArray(brokerInfo.host)) {
				M4C.RaceDCore.race({connKey: btID, company: brokerInfo.company, product: brokerInfo.product, hostList: brokerInfo.host, portList: brokerInfo.port}).then(obj=>{
					brokerInfo.$host = obj.host;
					brokerInfo.$port = obj.port;
				}).catch(err=>{});
			}
		},
		// 準備採集資訊
		prepareDeviceDigest(bto, brokerInfo, wsConn) {
			let self = this;
			wsConn.$STATUS = this.$ln('正在采集穿透式资讯');
			let btID = `${bto.brokerID}|${bto.traderID}`;
			// 解除相同 btID 的前次監聽 (若前次採集因故沒有反應時)
			this.unwatch(btID);
			// 清空採集資訊 (每次重連都要重新採集)
			this.$set(this.$store.state.device.deviceDigestMap, btID, null);
			// 監聽採集資訊
			this.unwatchMap[btID] = this.$store.watch(state=>state.device.deviceDigestMap[btID], function(nv, ov) {
				if (nv) {
					console.log(`[${btID}] M4C.LoginTrade.deviceDigestMap : `, nv);
					self.connectLogin(bto);
					// 解除監聽
					self.unwatch(btID);
				}
			});
			// 進行採集 (採集可能是同步或非同步，這邊利用完成後填入 deviceDigestMap 觸發 watch，免採集的情境也通用)
			M4C.TradeAPI.digest(bto, brokerInfo);
		},
		/** 解除指定 btID 的採集監聽 */
		unwatch(btID) {
			if (this.unwatchMap[btID]) {
				this.unwatchMap[btID]();
				delete this.unwatchMap[btID];
			}
		},
		// 建立連線並登入
		connectLogin(bto) {
			let self = this;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			let brokerInfo = this.getBrokerInfo(bto);
			let protocol = brokerInfo.protocol || "wss";
			// 優先使用競速結果對應的port
			let port = brokerInfo.$port || brokerInfo.port;
			port = port ? `:${port}` : ``;
			let wsuri = brokerInfo.wsuri || "/ss2";
			let info = {};
			info.project = this.$store.state.config.projectID;
			info.type = 'trade';
			info.host = `${protocol}://${brokerInfo.$host}${port}${wsuri}`;
			info.comp = brokerInfo.company || bto.brokerID;
			info.prod = brokerInfo.product || "x4";
			info.user = bto.traderID;
			info.login3rd = true;
			info.apiPath = `${brokerInfo.apiProtocol || 'https'}://${brokerInfo.$host}${port}/ss2/api`;
			info.brokerID = bto.brokerID;
			info.traderID = bto.traderID;
			info.btID = btID;
			info.tradePdSettingKey = brokerInfo.tradePdSettingKey;
			if (bto.THIRD_PARTY_ID)
				info.THIRD_PARTY_ID = bto.THIRD_PARTY_ID;
			// 建立連線並登入AC
			let wsConn = M4C.connect(info);
			// 將 BTO 物件放入 wsConn
			// this.$set(wsConn, 'bto', bto);

			// 動態建立監聽 [連線登入結果]
			if (!this.alreadyWatch[btID]) {
				// 避免執行監聽兩次
				this.alreadyWatch[btID] = true;
				this.$store.watch(state=>state.wsConnMap[btID].$STATUS, function(nv, ov) {
					if (!nv) return;
					console.log(M4C.getWsConnMark(wsConn), `狀態改變 :`, nv);
					// AC 登入完成
					if (nv === 'AC-LOGIN-READY') {
						// 交易登入
						M4C.Trader.traderLogin(wsConn);
					}
					// AC 登入失敗
					else if (nv === 'AC-LOGIN-FAIL') {
					}
					// 交易登入完成
					else if (nv === 'TRADER-LOGIN-READY') {
					}
					// 交易登入失敗
					else if (nv === 'TRADER-LOGIN-FAIL') {
						// 密碼過期或失效 (-62:AC服務強制修改密碼, -551:Gateway強制修改密碼, -63:AC服務密碼已失效, -559:後台強制修改密碼) 不執行斷線。
						if (wsConn.$CD === -62 || wsConn.$CD === -63 || wsConn.$CD === -551 || wsConn.$CD === -559) return;
						// 中斷連線
						M4C.disconnectWsConn(wsConn);
					}
				});
			}
		},
		/** 本次交易連線的設定內容 */
		getBrokerInfo(bto) {
			return this.$store.state.brokerMap[bto.brokerKey || bto.brokerID];
		},
	},
	watch: {
		// 啟動後的開始自動登入(僅限一次)
		initialAutoLogin(nv) {
			if (nv) this.allAutoLogin();
		},
	},
    computed: {
		ipv4() {
			return this.$store.state.device.ipv4;
		},
		ipv6() {
			return this.$store.state.device.ipv6;
		},
		quoteConnect() {
			return this.$store.state.wsConnMap.quote || {};
		},
		// 是否自動登入
		initialAutoLogin() {
			// 不啟動自動登入機制 (ex. 該貼牌有自己的登入頁)
			if (this.$store.state.config.CONFIG.NOT_AUTO_LOGIN_TRADE) return false;
			// executeOnce + quote.loginReady，來控制啟動後的開始自動登入(僅限一次)
			if (this.executeOnce && this.quoteConnect.loginReady && this.ipv4!=null && this.ipv6!=null) {
				this.executeOnce = false;
				return true;
			}
		},
		/** 主程式來源位置 */
		$host() {
			return this.$store.state.config.$path.LOGIN_HOST;
		},
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		/** 本次交易連線所使用的 host */
		host() {
			let host = this.$store.state.config.forceTradeHost || this.brokerInfo.host || this.$host;
			return Array.isArray(host) ? host[0] : host;
		},
		brokerID() {
			return this.loginBTO.brokerID;
		},
		// 台灣模式
		twMode(){
			return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
	},
}
</script>

<style scoped>
</style>