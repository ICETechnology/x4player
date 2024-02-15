<template>
	<div class="Account-Menu-ctn flex-col flex-center overflow-y-auto">
		<div class="flex-1 flex-col overflow-y-auto">
			<Button class="btn-confirm mgtb2" v-if="!$store.state.login.isSIM" @click="onBtnBankTransfer">{{$ln('资金转帐')}}</Button>
			<Button class="btn-confirm mgtb2" v-if="!$store.state.login.isSIM && supportStock" @click="onBtnWarrant">{{$ln('备兑锁定与解锁')}}</Button>
			<Button class="btn-confirm mgtb2" v-if="supportExercise" @click="onBtnExerciseRecord">{{$ln('行权记录')}}</Button>
			<Button class="btn-confirm mgtb2" v-if="supportNotice" @click="onNotice">{{$ln('讯息提醒')}}</Button>
			<Button class="btn-confirm mgtb2" :disabled="!traderID?'disabled':''" @click="onChangePassword">{{$ln('修改密码')}}</Button>
			<Button class="btn-confirm mgtb2" :disabled="!traderID?'disabled':''" v-if="isFut || isOption" @click="onBtnSettlement">{{$ln('结算单')}}</Button>
			<Button class="btn-confirm mgtb2" v-if="enableHistoryQuery" :disabled="!traderID?'disabled':''" @click="onHistoryQuery">{{$ln('历史查询')}}</Button>
			<Button class="btn-confirm mgtb2" v-if="enableInvestorservice" @click="onInvestorservice">{{$ln('市场监控中心')}}</Button>
		</div>
		<div class="flex-col mgtb5">
			<Button v-if="loginMoreTrader" class="btn-confirm dark" @click="onBtnDelete">{{$ln(`删除`)}}</Button>
			<Button v-if="loginReady" class="btn-confirm dark mgt2" :class="{'flex-1': !loginMoreTrader}" :disabled="!traderID?'disabled':''" @click="onBtnLogout">{{$ln('登出')}}</Button>
		</div>
	</div>
</template>
<script>
import Password from "@/components/Password.vue"
import BankTransferContainer from "@/components/BankTransfer/BankTransferContainer.vue";
export default {
	data() {
		return {
			
		}
	},
	components:{
		Password,
	},
	methods: {
		onNotice() {
			// 不在各組件初始化時查詢，只在開出三大提醒視窗時全部重新查詢一次。
			M4C.CommonQuery.queryAllNotice();
			eventBus.$emit('POPUP-DIALOG', "NoticeMSG");
		},
		/** 行權記錄 */
		onBtnExerciseRecord() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', "ExerciseRecord");
		},
		onBtnSettlement() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			let config = {transName: 'float'};
			// if (this.isDesktop) {
			// 	// config.style= "width: 80%; height: 70%; top: 15%; left: 10%;";
			// 	config.size= "big";
			// }
			eventBus.$emit('POPUP-DIALOG', 'Settlement', "", config);
		},
		onChangePassword(){
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', Password, '', {transName: 'float'});
		},
		// 刪除此帳號
		onBtnDelete() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("清除帐号"),
				content: self.$ln("在帐号列表中移除此帐号"),
				confirm: () => {
					let idx = self.loginedBTOList.findIndex((bto)=>{return bto.brokerID === self.brokerID && bto.traderID === self.traderID;});
					self.loginedBTOList.splice(idx, 1);
					// 登出
					M4C.Trader.logout();
					// 關閉自己
					eventBus.$emit("CLOSE-DIALOG", self.$parent);
				}
			});
		},		
		onBtnLogout() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "登出",
				content: this.$ln("点击确认登出"),
				confirm: ()=>{
					// 台灣模式直接 reload
					if (self.$store.state.config.twMode) {
						setTimeout(()=>{window.location.reload();}, 100);
					}
					// 中國模式只登出交易帳號
					else {
						M4C.Trader.logout();
						// eventBus.$emit("CLOSE-DIALOG");
					}
				},
			});
		},
		/** 備兌鎖定與解鎖 */
		onBtnWarrant() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', 'Warrant');
		},
		/** 银期转帐 */
		onBtnBankTransfer() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', BankTransferContainer, null, {mask: true});
		},
		/** 外跳監控中心連結 */
		onInvestorservice() {
			window.openLink("https://investorservice.cfmmc.com/");
		},
		onHistoryQuery() {
			eventBus.$emit('POPUP-DIALOG', 'DesktopHistoryQuery');
		}
	},
	computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		brokerKey() {
			return this.$store.state.login.brokerKey;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		/** 是否允許登入/切換其它交易帳號 */
		loginMoreTrader() {
			return this.$store.state.config.CONFIG.LOGIN_MORE_TRADER;
		},
		// 當前帳號支持行權功能 (SIM、ntp30305 不支持 )
		supportExercise() {
			return !this.$store.state.login.isSIM && this.$store.state.config.CONFIG.ENABLE_EXERCISE && this.isOptionAcc;
		},
		// 支援三大提醒功能(台灣、SIM、ntp30305不支援)
		supportNotice() {
			return !this.twMode && this.$store.state.login.brokerID !== "IceTech" && this.isStockOptionAcc && this.threeAlert;
		},
		twMode() {return this.$store.state.config.twMode;},
		// 當前帳號是股票期權
		isStockOptionAcc() {return this.$store.state.login.isStockOption;},
		// 當前帳號是期權
		isOptionAcc() {return this.$store.state.login.isOption;}, 
		/** 已有登入記憶的交易帳號列表 */
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		// 當前帳號支持股票 (ex.個股期權帳號)
		supportStock() {
			let pds = this.$store.state.config.tradePdSetting;
			let tp = pds && pds.broker && pds.broker.tp ? pds.broker.tp : [];
			let obj = tp.find((code)=>{return code % 100 === 5;});
			return !!obj;
		},
		isStock() {return this.$store.state.login.isStock;},
		isFut() {return this.$store.state.login.isFut;},
		isOption() {return this.$store.state.login.isOption;},
		selectedWSConn() {
			return this.$store.state.selectedWSConn;
		},
		loginReady() {
			return this.selectedWSConn.loginReady;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// pdsetting的三大提醒
		threeAlert() {
			if(this.acPdSetting && this.acPdSetting.broker)
				return this.acPdSetting.broker.three_alerts != false;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerKey] || {};
		},
		// 顯示市場監控中心 (when CTP期貨帳號)
		enableInvestorservice() {
			return this.brokerInfo.system === 'CTP' && this.isFut;
		},
		// 支持歷史查詢
		enableHistoryQuery() {
			// 牛勤：只有 UFX & FGS 的 [股票期權] 支持歷史查詢
			if ((this.brokerInfo.system === 'UFX' || this.brokerInfo.system === 'FGS') && this.isStockOption)
				return true;
		}
    },
}
</script>
<style scoped>

</style>