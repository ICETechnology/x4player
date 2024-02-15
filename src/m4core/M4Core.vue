<template>
    <div class="m4core-ctn hidden">
		<!-- 連線核心 -->
		<M4C />
		<!-- 多執行序資料解壓核心 -->
		<M4C_Decode />
		<!-- 印 log 核心 -->
		<M4C_Console />
		<!-- 登入核心 -->
		<M4C_AC />
		<!-- Dispatcher核心 -->
		<M4C_Dispatcher />
		<!-- 交易帳號核心 -->
		<M4C_Trader />
		<!-- 結算單核心 -->
		<M4C_Settlement />
		<!-- 自選核心 -->
		<M4C_SelfGroup />
		<!-- Symbol核心 -->
		<M4C_Symbol />
		<!-- 行情核心 -->
		<M4C_Quote />
		<!-- 線圖資料核心 -->
		<M4C_ChartData />
		<!-- SciChart線圖資料核心 -->
		<M4C_SciChartData />
		<!-- 下單核心 -->
		<M4C_Order />
		<!-- 回報核心 -->
		<M4C_Report />
		<!-- 持倉核心 -->
		<M4C_Position />
		<!-- 组合持倉核心 -->
		<M4C_CombinePosition />
		<!-- 資金核心 -->
		<M4C_Margin />
		<!-- 備兌核心 -->
		<M4C_Warrant />
		<!-- 廣告核心 -->
		<M4C_AD />
		<!-- 行權核心 -->
		<M4C_Exercise />
		<!-- 期權核心 -->
		<M4C_Option />
		<!-- 银期转帐核心 -->
		<M4C_BankTransfer />
		<!-- 背景推播BGInfo核心 -->
		<M4C_BGInfo v-if="$store.state.status.windowDeviceAvailable" />
		<!-- 語系檔核心 -->
		<M4C_Language />
		<!-- 語系檔核心 -->
		<M4C_Article />
		<!-- 登入交易帳號專用核心 -->
		<M4C_LoginTrade />
		<!-- 發送統計專用核心 -->
		<M4C_Analysis />
		<!-- 通用查詢核心 -->
		<M4C_CommonQuery />
		<!-- 歷史資料核心 -->
		<M4C_HistoryData />
		<!-- 多帳號管理BTO核心 -->
		<M4C_BTO />
		<!-- PdSetting管理核心 -->
		<M4C_PdSetting />
		<!-- 穿透式採集核心 -->
		<M4C_TradeAPI />
		<!-- 問題回報核心 -->
		<M4C_Issue />
		<!-- 連線測試競速核心 -->
		<M4C_RaceDCore />
		<!-- 公告核心 -->
		<M4C_Announce />
		<!-- KChart資料處理核心 -->
		<!-- <M4C_KChartDataCore /> -->
		<!-- 查詢 IP 核心 -->
		<M4C_IP />
		<!-- 欄位設定核心 -->
		<M4C_ColumnSD />
		<!-- 歷史查詢核心 -->
		<M4C_HistoryQuery />
		<!-- GTC核心 -->
		<M4C_GTC />
		<!-- 拆單核心 -->
		<M4C_Order_Split />
		<!-- Wechat 核心 -->
		<M4C_Wechat />
		<!-- Server 版本 -->
		<M4C_ServerVersion />
		<!-- OTP核心 -->
		<M4C_OTP />
		<!-- 憑證核心 -->
		<M4C_Cert />
		<!-- Http核心 (目前僅用在 TW Trade Http 相關) -->
		<M4C_Http />
		<!-- Sim 帳號核心 -->
		<M4C_Sim />
		<!-- ContractSpec 核心 -->
		<M4C_ContractSpec />
		<!-- 大字型核心 -->
		<M4C_FontSize />
		<!-- 連續IOC核心 -->
		<M4C_ContinuousIOC />
		<!-- PostMessage核心 -->
		<M4C_PostMessage />
		<!-- SSLPinning核心 -->
		<M4C_SSLPinning />
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>