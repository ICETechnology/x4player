<template>
    <div class="m4c-pdsetting" v-show="false">
		<span>{{tradePdSetting}}</span>
		<span>{{quotePdSetting}}</span>
		<span>{{brokerKeyToID}}</span>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			watchMap: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.PdSetting = this.$store.state.m4c.pdSetting = this;
	},
	mounted() {
		// 支持公開設定裡的 brokers 處理 (台灣情境)
		this.publicBrokers.forEach(obj=>{
			this.updateBrokerMap(obj);
		});
		// 不可放在 beforeMount 以免比 StoreManager.beforeMount 早而導致沒有被存入
		if (this.publicPdSetting)
			this.onPublicSettingReady();
	},
    methods: {
		// 填入 MAC 欄位
		updateMAC() {
			let pds = this.publicPdSetting;
			// macAddress 欄位
			let content = this.$store.state.device.macAddress || this.genMAC();
			// 有設定 uuidToMac 時 : 優先使用 uuid (填入 mac 欄位)
			if (pds && pds.function && pds.function.uuidToMac) {
				let uuid = window.device && window.device.uuid ? window.device.uuid : null;
				content = uuid || content;
			}
			this.$store.state.device.macAddress = content;
		},
		// 公開設定完成
		onPublicSettingReady() {
			// 確保只執行一次
			if (this.doThisOnce) return; this.doThisOnce = true;
			console.log('M4C.PdSetting.onPublicSettingReady');
			let pds = this.publicPdSetting;
			// 填入 MAC 欄位
			this.updateMAC();

			// 支持從公開設定指定 [報價預設樣式] 與 [報價樣式陣列]
			if (pds.CONFIG){
				if (pds.CONFIG.QUOTE_STYLE)
					this.$store.state.config.quoteStyle = pds.CONFIG.QUOTE_STYLE;
				if (pds.CONFIG.QUOTE_STYLE_LIST)
					this.$store.state.config.quoteStyleList = pds.CONFIG.QUOTE_STYLE_LIST;
			}
			// 支持 publicPdSetting.function.tvc 指定改使用 TVC
			if (pds.function && pds.function.tvc) {
				this.$store.state.status.mixChartActivComclass = 'TvcLine';
			}
		},
		// 建立 MAC-ADDRESS
		genMAC(){
			var hexDigits = "0123456789ABCDEF";
			var macAddress = "";
			for (var i = 0; i < 6; i++) {
				macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
				macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
				if (i != 5) macAddress += ":";
			}
			return macAddress;
		},

		// 準備pdsetting
		preparePdSetting(pds) {
			// 相容 broker.risk_value -> broker.enableRiskControl
			try{pds.broker.enableRiskControl = pds.broker.enableRiskControl || pds.broker.risk_value;}catch(e){}
		},
		updateBrokerMap(obj) {
			obj.broker_key = obj.broker_key || obj.broker_id;
			this.$store.state.brokerMap[obj.broker_key] = obj;
			this.$store.state.brokerNameMap[obj.broker_key] = this.$ln(obj.label);
		},
		// 準備BrokerMap
		prepareBrokerMap(wsConn) {
			let btID = wsConn.key;
			if (btID === 'quote') {
				this.getBrokerList(wsConn).forEach(obj=>{
					this.updateBrokerMap(obj);
				});
			}
		},
		getBrokerList(wsConn) {
			if (wsConn.acPdSetting.trade.brokers.length > 0)
				return wsConn.acPdSetting.trade.brokers;
			return [];
		},
	},
	watch: {
		'$store.state.wsConnMap'(nv, ov) {
			Object.keys(nv).forEach((btID)=>{
				// 一個 btID 僅建立監看一次，以免多次呼入
				if (this.watchMap[btID] == null) {
					this.watchMap[btID] = true;
					// 監看連線登入成功
					this.$store.watch(state=>state.wsConnMap[btID].acResponse, function(nv) {
						let wsConn = this.wsConnMap[btID];
						if (wsConn.acResponse && wsConn.acResponse.d && wsConn.acResponse.d['pd.setting']) {
							let pds = wsConn.acResponse.d['pd.setting'];
							// 準備pdsetting
							this.preparePdSetting(pds);
							// 將 pdsetting 放入 wsConn
							this.$set(wsConn, 'acPdSetting', pds);
							// 支持公開設定的 quotePdSetting 優先
							if (btID === 'quote' && this.publicPdSetting.quotePdSetting)
								wsConn.acPdSetting = this.publicPdSetting.quotePdSetting;
							// 準備BrokerMap
							this.prepareBrokerMap(wsConn);
						}
					}.bind(this));
				}
			});
		},
		publicPdSetting(nv) {
			if (nv)
				this.onPublicSettingReady();
		},
	},
    computed: {
		wsConnMap() {
			return this.$store.state.wsConnMap;
		},
		selectedWSConn() {
			return this.$store.state.selectedWSConn;
		},
		/** 報價連線的 pdsetting */
		quotePdSetting() {
			// 相容於從本從報價連線取得的客端設定，也支持從公開設定.quotePdSetting 取得(優先)
			return this.$store.state.config.quotePdSetting = this.publicPdSetting.quotePdSetting || (this.wsConnMap.quote ? (this.wsConnMap.quote.acPdSetting || {}) : {});
		},
		/** 當前選擇交易帳號的 pdsetting */
		tradePdSetting() {
			// 相容於從本從交易連線取得的客端設定，也支持從公開設定.tradePdSetting[KEY] 取得(優先)
			let obj = this.publicPdSetting.tradePdSetting || {};
			let key = this.selectedWSConn && this.selectedWSConn.info ? this.selectedWSConn.info.tradePdSettingKey : null;
			return this.$store.state.config.tradePdSetting = obj[key] || this.selectedWSConn.acPdSetting;
		},
		// brokerKey to brokerID 對應表
		brokerKeyToID() {
			let result = {};
			try {
				this.quotePdSetting.trade.brokers.forEach(brokerInfo=>{
					result[brokerInfo.broker_key] = brokerInfo.broker_id;
				});
			}catch(err){}
			return this.$store.state.config.brokerKeyToID = result;
		},
		// 公開設定裡的 broker 列表
		publicBrokers() {
			try{return this.$store.state.config.publicPdSetting.trade.brokers || [];}catch(e){return [];}
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting || {};
		},
	},
}
</script>
