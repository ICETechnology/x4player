<template>
    <div class="m4c-trade-api-app hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			digestResult: {},
		}
	},
	beforeMount() {
		M4C.TradeAPI = this;
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 採集
		digest(bto) {
			let self = this;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			let brokerInfo = this.getBrokerInfo(bto);
			let brokerMode = this.getBrokerMode(brokerInfo);
			// 移除這個僅執行一次的旗標
			delete this.executeOnce;
			// 設定要求穿透式 && 有存在穿透式API
			if (brokerMode && window.plugins && window.plugins.TradeApi) {
				// 避免印到 traderPwd
				let cloneBTO = JSON.parse(JSON.stringify(bto));
				cloneBTO.traderPwd = "[NOT-LOG-FOR-SECURITY]";
				console.log(`[${btID}] M4C.TradeAPI.digest`, cloneBTO);
				let tradeApi = window.plugins.TradeApi;
				// 此交易系統支持穿透式
				tradeApi.isSupported(brokerMode, function() {
					// 已有穿透式需要的權限
					tradeApi.hasPermission(function(){
						// 以穿透式API取得裝置資訊後登入
						self.getDeviceInfo(bto, brokerMode);
					// 沒有穿透式需要的權限
					}, function(){
						// 取得所需權限
						tradeApi.requestPermission(function(){
							// 以穿透式API取得裝置資訊後登入
							self.getDeviceInfo(bto, brokerMode);
						// 未取得所需權限
						}, function(){
							self.deviceDigestMap[btID] = {$ERROR: 'NO-PERMISSION'};
						});
					});
				// 此交易系統不支持穿透式
				}, function(){
					self.deviceDigestMap[btID] = {$ERROR: 'NO-SUPPORT'};
				});
			}
			// 未設定要求穿透式 || 不存在穿透式API
			else {
				self.deviceDigestMap[btID] = {$ERROR: 'NO-SYSTEM-OR-API'};
			}
		},
		// 以穿透式API取得裝置資訊後登入
		getDeviceInfo(bto, brokerMode) {
			let self = this;
			// 取得穿透式 deviceInfo
			window.plugins.TradeApi.getDeviceSystemInfo({'brokerMode': brokerMode}, function(obj){
				let btID = `${bto.brokerID}|${bto.traderID}`;
				console.log(`${btID} DeviceSystemInfo: `, obj);
				self.deviceDigestMap[btID] = obj;
			// 未取得穿透式 deviceInfo
			}, function(){
				self.deviceDigestMap[btID] = {$ERROR: 'GET-FAIL'};
			});
		},
		/** 本次交易連線的設定內容 */
		getBrokerInfo(bto) {
			return this.$store.state.brokerMap[bto.brokerKey || bto.brokerID];
		},
		/** 本交易連線是否有指定為特定的交易系統 (用來對應穿透式API) */
		getBrokerMode(brokerInfo) {
			return brokerInfo && brokerInfo.system ? brokerInfo.system : "";
		},
	},
	watch: {},
    computed: {
		deviceDigestMap() {
			return this.$store.state.device.deviceDigestMap;
		},
	},
}
</script>

<style scoped>
</style>